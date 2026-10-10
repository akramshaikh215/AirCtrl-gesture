"""Allow eye-input history without changing existing events."""
from alembic import op
import sqlalchemy as sa
revision='20261010_eye_events'
down_revision='fbc84b67580f'
branch_labels=None
depends_on=None

def change(allowed):
    connection=op.get_bind()
    constraints=sa.inspect(connection).get_check_constraints('command_events')
    # The initial revision used an unnamed CHECK. PostgreSQL assigns its name;
    # inspect it rather than assuming a particular database-generated name.
    source_checks=[c for c in constraints if 'source' in c['sqltext']]
    for c in source_checks:
        if not c.get('name'):
            raise RuntimeError('This migration requires the documented PostgreSQL database.')
        op.drop_constraint(c['name'],'command_events',type_='check')
    op.create_check_constraint('ck_command_events_source','command_events',allowed)

def upgrade():
    change("source IN ('gesture','voice','eyes')")

def downgrade():
    # Preserve historical eye actions under the prior generic gesture category.
    op.execute("UPDATE command_events SET source='gesture' WHERE source='eyes'")
    change("source IN ('gesture','voice')")
