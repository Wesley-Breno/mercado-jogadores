import ast
from pathlib import Path

import pytest

APP = Path(__file__).resolve().parents[1] / "app"

# Dependencies point inwards: routers -> services -> (domain, repositories); the domain is pure.
FORBIDDEN_IMPORTS = {
    "domain": (
        "app.api",
        "app.core",
        "app.models",
        "app.repositories",
        "app.services",
        "fastapi",
        "pydantic",
        "sqlalchemy",
    ),
    "repositories": ("app.api", "app.services"),
    "services": ("app.api",),
}


def imported_modules(path: Path) -> set[str]:
    modules: set[str] = set()
    for node in ast.walk(ast.parse(path.read_text(encoding="utf-8"))):
        if isinstance(node, ast.Import):
            modules.update(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            modules.add(node.module)
    return modules


@pytest.mark.parametrize("layer", sorted(FORBIDDEN_IMPORTS))
def test_layer_does_not_depend_on_outer_layers(layer: str) -> None:
    offenders = [
        f"{path.name} importa {module}"
        for path in sorted((APP / layer).glob("*.py"))
        for module in sorted(imported_modules(path))
        if module.startswith(FORBIDDEN_IMPORTS[layer])
    ]

    assert offenders == []
