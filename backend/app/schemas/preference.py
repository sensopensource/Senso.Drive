from typing import Any
from pydantic import BaseModel


class DashboardLayout(BaseModel):
    layout: Any
