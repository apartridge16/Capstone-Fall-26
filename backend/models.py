from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


# Base class for our database models.
class Base(DeclarativeBase):
    pass


# Store registered Strength AI users.
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


# Store strength progression programs created by users.
class Program(Base):
    __tablename__ = "programs"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    # Connect this program to the user who created it.
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    lift: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    starting_pr: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    goal_pr: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    goal_increase_percent: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    recommended_weeks: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    selected_weeks: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    current_week: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )

    initial_attainability: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    current_attainability: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="active",
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
