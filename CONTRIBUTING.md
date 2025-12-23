# Contributing to Restorio Platform

Thank you for considering contributing to Restorio! This document provides guidelines and standards for contributing to the project.

## Development Setup

See [DEVELOPMENT.md](./DEVELOPMENT.md) for complete setup instructions.

## How to Contribute

1. **Fork the repository**
2. **Create a feature branch** from `main`
3. **Make your changes** following our coding standards
4. **Write or update tests** as needed
5. **Ensure all tests pass** and code is formatted
6. **Submit a pull request**

## Coding Standards

### TypeScript

- Always declare return types for top-level functions
- Avoid `any` and `unknown` types unless absolutely necessary
- Use interfaces for object shapes, types for unions/primitives
- Reuse existing types before creating new ones

```typescript
// Good
const fetchUser = async (id: string): Promise<User> => {
  return await api.users.get(id);
};

// Bad
const fetchUser = async (id: string) => {
  return await api.users.get(id);
};
```

### React Components

- Use functional components with hooks
- Props interfaces should be defined above the component
- Export components as named exports

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary';
  onClick: () => void;
}

export const Button: React.FC<ButtonProps> = ({ variant, onClick }) => {
  return <button className={variant} onClick={onClick} />;
};
```

### Python (FastAPI)

- Follow PEP 8 style guide
- Use type hints for all functions
- Use Pydantic models for request/response validation
- Keep endpoints focused and single-purpose

```python
from pydantic import BaseModel

class UserCreate(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str

@app.post("/users", response_model=User)
async def create_user(user: UserCreate) -> User:
    return await user_service.create(user)
```

## Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation changes
- `style:` formatting, missing semicolons, etc.
- `refactor:` code refactoring
- `test:` adding tests
- `chore:` maintenance tasks

Examples:

```
feat: add user authentication endpoint
fix: resolve order status update bug
docs: update API documentation for menus
refactor: simplify tenant resolution logic
```

## Pull Request Process

1. Update documentation if you're changing functionality
2. Add tests for new features
3. Ensure all tests pass: `bun test`
4. Format code: `bun run format`
5. Update the CHANGELOG if applicable
6. Request review from maintainers

## Testing

- Write unit tests for business logic
- Write integration tests for API endpoints
- Test edge cases and error handling
- Aim for meaningful test coverage, not just high numbers

## Documentation

- Update README.md for user-facing changes
- Update DEVELOPMENT.md for developer setup changes
- Add JSDoc/docstrings for public APIs
- Keep comments minimal and meaningful

## Questions?

Feel free to open an issue for questions or discussions about contributing.
