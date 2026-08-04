from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.authorization.actions import AuthorizationAction
from core.authorization.policies import DELEGABLE_ACTIONS
from core.dto.v1.access_groups import AccessGroupResponseDTO, AccessGroupUpsertDTO
from core.exceptions import BadRequestError, ConflictError, NotFoundResponse
from core.models.access_group import AccessGroup, AccessGroupAssignment
from core.models.enums import AccountType
from core.models.tenant_role import TenantRole


class AccessGroupService:
    async def list_groups(
        self, session: AsyncSession, tenant_id: UUID
    ) -> list[AccessGroupResponseDTO]:
        groups = list(
            await session.scalars(
                select(AccessGroup)
                .where(AccessGroup.tenant_id == tenant_id)
                .order_by(AccessGroup.name.asc())
            )
        )
        assignment_rows = (
            await session.execute(
                select(AccessGroupAssignment.group_id, AccessGroupAssignment.account_id)
                .join(AccessGroup, AccessGroup.id == AccessGroupAssignment.group_id)
                .where(AccessGroup.tenant_id == tenant_id)
            )
        ).all()
        members_by_group: dict[UUID, list[UUID]] = {}
        for group_id, account_id in assignment_rows:
            members_by_group.setdefault(group_id, []).append(account_id)
        return [self._to_dto(group, members_by_group.get(group.id, [])) for group in groups]

    async def create_group(
        self,
        session: AsyncSession,
        tenant_id: UUID,
        data: AccessGroupUpsertDTO,
    ) -> AccessGroupResponseDTO:
        await self._ensure_unique_name(session, tenant_id, data.name)
        capabilities = self._validate_capabilities(data.capabilities)
        group = AccessGroup(
            tenant_id=tenant_id,
            name=data.name,
            name_normalized=data.name.casefold(),
            description=data.description,
            capabilities=capabilities,
        )
        session.add(group)
        await session.flush()
        await session.refresh(group)
        return self._to_dto(group, [])

    async def update_group(
        self,
        session: AsyncSession,
        tenant_id: UUID,
        group_id: UUID,
        data: AccessGroupUpsertDTO,
    ) -> AccessGroupResponseDTO:
        group = await self._get_group(session, tenant_id, group_id)
        normalized_name = data.name.casefold()
        if group.name_normalized != normalized_name:
            await self._ensure_unique_name(session, tenant_id, data.name)
        group.name = data.name
        group.name_normalized = normalized_name
        group.description = data.description
        group.capabilities = self._validate_capabilities(data.capabilities)
        await session.flush()
        await session.refresh(group)
        member_ids = list(
            await session.scalars(
                select(AccessGroupAssignment.account_id).where(
                    AccessGroupAssignment.group_id == group.id
                )
            )
        )
        return self._to_dto(group, member_ids)

    async def delete_group(self, session: AsyncSession, tenant_id: UUID, group_id: UUID) -> None:
        group = await self._get_group(session, tenant_id, group_id)
        await session.delete(group)
        await session.flush()

    async def assign_member(
        self,
        session: AsyncSession,
        tenant_id: UUID,
        group_id: UUID,
        account_id: UUID,
    ) -> None:
        await self._get_group(session, tenant_id, group_id)
        membership = await session.scalar(
            select(TenantRole).where(
                TenantRole.tenant_id == tenant_id,
                TenantRole.account_id == account_id,
            )
        )
        if membership is None or membership.account_type == AccountType.OWNER:
            raise BadRequestError(message="Access groups can only be assigned to tenant employees")
        existing = await session.get(
            AccessGroupAssignment,
            {"group_id": group_id, "account_id": account_id},
        )
        if existing is None:
            session.add(
                AccessGroupAssignment(
                    group_id=group_id,
                    account_id=account_id,
                    tenant_id=tenant_id,
                )
            )
            await session.flush()

    async def unassign_member(
        self,
        session: AsyncSession,
        tenant_id: UUID,
        group_id: UUID,
        account_id: UUID,
    ) -> None:
        await self._get_group(session, tenant_id, group_id)
        assignment = await session.get(
            AccessGroupAssignment,
            {"group_id": group_id, "account_id": account_id},
        )
        if assignment is not None:
            await session.delete(assignment)
            await session.flush()

    async def _get_group(
        self, session: AsyncSession, tenant_id: UUID, group_id: UUID
    ) -> AccessGroup:
        group = await session.scalar(
            select(AccessGroup).where(
                AccessGroup.id == group_id,
                AccessGroup.tenant_id == tenant_id,
            )
        )
        if group is None:
            resource_name = "Access group"
            raise NotFoundResponse(resource_name, str(group_id))
        return group

    async def _ensure_unique_name(self, session: AsyncSession, tenant_id: UUID, name: str) -> None:
        existing = await session.scalar(
            select(AccessGroup.id).where(
                AccessGroup.tenant_id == tenant_id,
                AccessGroup.name_normalized == name.casefold(),
            )
        )
        if existing is not None:
            raise ConflictError(message="An access group with this name already exists")

    @staticmethod
    def _validate_capabilities(capabilities: list[AuthorizationAction]) -> list[str]:
        requested = set(capabilities)
        forbidden = requested - DELEGABLE_ACTIONS
        if forbidden:
            names = ", ".join(sorted(action.value for action in forbidden))
            raise BadRequestError(message=f"Capabilities cannot be delegated: {names}")
        return sorted(action.value for action in requested)

    @staticmethod
    def _to_dto(group: AccessGroup, member_ids: list[UUID]) -> AccessGroupResponseDTO:
        return AccessGroupResponseDTO(
            id=group.id,
            name=group.name,
            description=group.description,
            capabilities=group.capabilities,
            member_ids=sorted(member_ids, key=str),
            created_at=group.created_at,
            updated_at=group.updated_at,
        )
