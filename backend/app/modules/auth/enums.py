"""Role enumerations for user permissions."""

from enum import Enum


class Role(str, Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    SUPPORT = "support"
