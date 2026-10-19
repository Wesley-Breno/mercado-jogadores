from http import HTTPStatus


class DomainError(Exception):
    status_code: HTTPStatus = HTTPStatus.BAD_REQUEST

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class BadRequestError(DomainError):
    status_code = HTTPStatus.BAD_REQUEST


class NotFoundError(DomainError):
    status_code = HTTPStatus.NOT_FOUND


class ConflictError(DomainError):
    status_code = HTTPStatus.CONFLICT
