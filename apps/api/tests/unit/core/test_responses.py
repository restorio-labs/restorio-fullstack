from fastapi import status

from core.foundation.http.responses import (
    created_response,
    deleted_response,
    error_response,
    paginated_response,
    success_response,
    updated_response,
)
from core.foundation.http.schemas import PaginatedResponse as PaginatedResponseSchema


class TestSuccessResponse:
    def test_success_response_with_data(self) -> None:
        data = {"id": 1, "name": "Test"}
        response = success_response(data)

        assert response.status_code == status.HTTP_200_OK
        content = response.body.decode()
        assert "data" in content
        assert "id" in content

    def test_success_response_with_message(self) -> None:
        data = {"id": 1}
        message = "Operation successful"
        response = success_response(data, message=message)

        assert response.status_code == status.HTTP_200_OK
        content = response.body.decode()
        assert message in content

    def test_success_response_with_custom_status_code(self) -> None:
        data = {"id": 1}
        response = success_response(data, status_code=status.HTTP_202_ACCEPTED)

        assert response.status_code == status.HTTP_202_ACCEPTED


class TestCreatedResponse:
    def test_created_response_default_message(self) -> None:
        data = {"id": 1, "name": "Test"}
        response = created_response(data)

        assert response.status_code == status.HTTP_201_CREATED
        content = response.body.decode()
        assert "Resource created successfully" in content

    def test_created_response_custom_message(self) -> None:
        data = {"id": 1}
        message = "User created"
        response = created_response(data, message=message)

        assert response.status_code == status.HTTP_201_CREATED
        content = response.body.decode()
        assert message in content


class TestUpdatedResponse:
    def test_updated_response_default_message(self) -> None:
        data = {"id": 1, "name": "Updated"}
        response = updated_response(data)

        assert response.status_code == status.HTTP_200_OK
        content = response.body.decode()
        assert "Resource updated successfully" in content

    def test_updated_response_custom_message(self) -> None:
        data = {"id": 1}
        message = "User updated"
        response = updated_response(data, message=message)

        assert response.status_code == status.HTTP_200_OK
        content = response.body.decode()
        assert message in content


class TestDeletedResponse:
    def test_deleted_response_default_message(self) -> None:
        response = deleted_response()

        assert response.status_code == status.HTTP_200_OK
        content = response.body.decode()
        assert "Resource deleted successfully" in content

    def test_deleted_response_custom_message(self) -> None:
        message = "User deleted"
        response = deleted_response(message=message)

        assert response.status_code == status.HTTP_200_OK
        content = response.body.decode()
        assert message in content


class TestPaginatedResponse:
    def test_paginated_response(self) -> None:
        paginated_data = PaginatedResponseSchema(
            items=[{"id": 1}, {"id": 2}],
            total=2,
            page=1,
            page_size=10,
            total_pages=1,
        )
        response = paginated_response(paginated_data)

        assert response.status_code == status.HTTP_200_OK
        content = response.body.decode()
        assert "items" in content
        assert "total" in content


class TestErrorResponse:
    def test_error_response_default_status(self) -> None:
        response = error_response("TEST_ERROR", "Test error message")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        content = response.body.decode()
        assert "TEST_ERROR" in content
        assert "Test error message" in content

    def test_error_response_custom_status(self) -> None:
        response = error_response(
            "NOT_FOUND", "Resource not found", status_code=status.HTTP_404_NOT_FOUND
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_error_response_with_details(self) -> None:
        details = {"field": "email", "reason": "invalid format"}
        response = error_response("VALIDATION_ERROR", "Validation failed", details=details)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        content = response.body.decode()
        assert "details" in content
