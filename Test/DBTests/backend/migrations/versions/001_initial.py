"""initial migration

Revision ID: 001
Revises: 
Create Date: 2026-04-10

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS timescaledb")
    
    op.create_table('S02IDENTIFICATION_TYPE',
        sa.Column('nIdIdentificationType', sa.Integer(), nullable=False),
        sa.Column('cName', sa.String(length=100), nullable=True),
        sa.Column('isActive', sa.Boolean(), nullable=True),
        sa.Column('tCreatedAt', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('nIdIdentificationType')
    )
    
    op.create_table('S01VENUE_TYPE',
        sa.Column('nIdVenueType', sa.Integer(), nullable=False),
        sa.Column('cName', sa.String(length=100), nullable=True),
        sa.Column('isActive', sa.Boolean(), nullable=True),
        sa.Column('tCreatedAt', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('nIdVenueType')
    )
    
    op.create_table('S01VENUE',
        sa.Column('nIdVenue', sa.Integer(), nullable=False),
        sa.Column('cName', sa.String(length=100), nullable=True),
        sa.Column('cDescription', sa.Text(), nullable=True),
        sa.Column('cLogoUrl', sa.String(length=500), nullable=True),
        sa.Column('cEmail', sa.String(length=100), nullable=True),
        sa.Column('nLatitude', sa.Numeric(precision=10, scale=8), nullable=True),
        sa.Column('nLongitude', sa.Numeric(precision=10, scale=8), nullable=True),
        sa.Column('cIdBoundarie', sa.String(length=50), nullable=True),
        sa.Column('nIdVenueType', sa.Integer(), nullable=True),
        sa.Column('bIsActive', sa.Boolean(), nullable=True),
        sa.Column('tCreatedAt', sa.DateTime(), nullable=True),
        sa.Column('tModifiedAt', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['nIdVenueType'], ['S01VENUE_TYPE.nIdVenueType']),
        sa.PrimaryKeyConstraint('nIdVenue')
    )
    
    op.create_table('S01PROGRAM',
        sa.Column('nIdProgram', sa.Integer(), nullable=False),
        sa.Column('nIdVenue', sa.Integer(), nullable=True),
        sa.Column('cName', sa.String(length=200), nullable=True),
        sa.Column('cDescription', sa.Text(), nullable=True),
        sa.Column('isActive', sa.Boolean(), nullable=True),
        sa.Column('tCreatedAt', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['nIdVenue'], ['S01VENUE.nIdVenue']),
        sa.PrimaryKeyConstraint('nIdProgram')
    )
    
    op.create_table('S01WORKSHOP',
        sa.Column('nIdWorkshop', sa.Integer(), nullable=False),
        sa.Column('nIdProgram', sa.Integer(), nullable=True),
        sa.Column('cName', sa.String(length=200), nullable=True),
        sa.Column('dDate', sa.Date(), nullable=True),
        sa.Column('isActive', sa.Boolean(), nullable=True),
        sa.Column('tCreatedAt', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['nIdProgram'], ['S01PROGRAM.nIdProgram']),
        sa.PrimaryKeyConstraint('nIdWorkshop')
    )
    
    op.create_table('S02PERSON',
        sa.Column('nIdPerson', sa.Integer(), nullable=False),
        sa.Column('nIdIdentificationType', sa.Integer(), nullable=True),
        sa.Column('cIdentificationNumber', sa.String(length=50), nullable=True),
        sa.Column('cFirstName', sa.String(length=100), nullable=True),
        sa.Column('cLastName', sa.String(length=100), nullable=True),
        sa.Column('cEmail', sa.String(length=150), nullable=True),
        sa.Column('cPhone', sa.String(length=20), nullable=True),
        sa.Column('tCreatedAt', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['nIdIdentificationType'], ['S02IDENTIFICATION_TYPE.nIdIdentificationType']),
        sa.PrimaryKeyConstraint('nIdPerson')
    )
    
    op.create_table('S02PARTICIPANT',
        sa.Column('nIdParticipant', sa.Integer(), nullable=False),
        sa.Column('nIdPerson', sa.Integer(), nullable=True),
        sa.Column('isActive', sa.Boolean(), nullable=True),
        sa.Column('tCreatedAt', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['nIdPerson'], ['S02PERSON.nIdPerson']),
        sa.PrimaryKeyConstraint('nIdParticipant')
    )
    
    op.create_table('S02PARTICIPANT_PROGRAM',
        sa.Column('nIdParticipantProgram', sa.Integer(), nullable=False),
        sa.Column('nIdParticipant', sa.Integer(), nullable=True),
        sa.Column('nIdProgram', sa.Integer(), nullable=True),
        sa.Column('tCreatedAt', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['nIdParticipant'], ['S02PARTICIPANT.nIdParticipant']),
        sa.ForeignKeyConstraint(['nIdProgram'], ['S01PROGRAM.nIdProgram']),
        sa.PrimaryKeyConstraint('nIdParticipantProgram')
    )
    
    op.create_table('S02WORKSHOP_TEAM',
        sa.Column('nIdWorkshopTeam', sa.Integer(), nullable=False),
        sa.Column('nIdWorkshop', sa.Integer(), nullable=True),
        sa.Column('cTeamName', sa.String(length=100), nullable=True),
        sa.Column('tCreatedAt', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['nIdWorkshop'], ['S01WORKSHOP.nIdWorkshop']),
        sa.PrimaryKeyConstraint('nIdWorkshopTeam')
    )
    
    op.create_table('S02WORKSHOP_TEAM_MEMBER',
        sa.Column('nIdWorkshopTeamMember', sa.Integer(), nullable=False),
        sa.Column('nIdWorkshopTeam', sa.Integer(), nullable=True),
        sa.Column('nIdParticipant', sa.Integer(), nullable=True),
        sa.Column('tCreatedAt', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['nIdParticipant'], ['S02PARTICIPANT.nIdParticipant']),
        sa.ForeignKeyConstraint(['nIdWorkshopTeam'], ['S02WORKSHOP_TEAM.nIdWorkshopTeam']),
        sa.PrimaryKeyConstraint('nIdWorkshopTeamMember')
    )
    
    op.create_table('S03METRIC_CATALOG',
        sa.Column('nIdMetricCatalog', sa.Integer(), nullable=False),
        sa.Column('cName', sa.String(length=100), nullable=True),
        sa.Column('cDataType', sa.String(length=1), nullable=True),
        sa.Column('cDescription', sa.Text(), nullable=True),
        sa.Column('isActive', sa.Boolean(), nullable=True),
        sa.Column('tCreatedAt', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('nIdMetricCatalog')
    )
    
    op.create_table('S03METRIC_WORKSHOP',
        sa.Column('nIdMetricWorkshop', sa.Integer(), nullable=False),
        sa.Column('nIdWorkshop', sa.Integer(), nullable=True),
        sa.Column('nIdMetricCatalog', sa.Integer(), nullable=True),
        sa.Column('isEnabled', sa.Boolean(), nullable=True),
        sa.Column('tCreatedAt', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['nIdMetricCatalog'], ['S03METRIC_CATALOG.nIdMetricCatalog']),
        sa.ForeignKeyConstraint(['nIdWorkshop'], ['S01WORKSHOP.nIdWorkshop']),
        sa.PrimaryKeyConstraint('nIdMetricWorkshop'),
        sa.UniqueConstraint('nIdWorkshop', 'nIdMetricCatalog')
    )
    
    op.create_table('S03METRIC_LOG',
        sa.Column('tTimestamp', sa.DateTime(), nullable=False),
        sa.Column('nIdMetricLog', sa.Integer(), nullable=False),
        sa.Column('nIdParticipant', sa.Integer(), nullable=True),
        sa.Column('nIdMetricWorkshop', sa.Integer(), nullable=True),
        sa.Column('fValue', sa.Numeric(), nullable=True),
        sa.ForeignKeyConstraint(['nIdMetricWorkshop'], ['S03METRIC_WORKSHOP.nIdMetricWorkshop']),
        sa.ForeignKeyConstraint(['nIdParticipant'], ['S02PARTICIPANT.nIdParticipant']),
        sa.PrimaryKeyConstraint('tTimestamp', 'nIdMetricLog')
    )
    
    op.create_table('S03INITIATIVE_TYPE',
        sa.Column('nIdInitiativeType', sa.Integer(), nullable=False),
        sa.Column('cCode', sa.String(length=50), nullable=False),
        sa.Column('cName', sa.String(length=100), nullable=False),
        sa.Column('cDescription', sa.Text(), nullable=True),
        sa.Column('isActive', sa.Boolean(), nullable=True),
        sa.Column('tCreatedAt', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('nIdInitiativeType'),
        sa.UniqueConstraint('cCode')
    )
    
    op.create_table('S03PROPOSAL',
        sa.Column('nIdProposal', sa.Integer(), nullable=False),
        sa.Column('nIdWorkshopTeam', sa.Integer(), nullable=True),
        sa.Column('nIdParticipant', sa.Integer(), nullable=True),
        sa.Column('nIdInitiativeType', sa.Integer(), nullable=True),
        sa.Column('cTitle', sa.String(length=200), nullable=False),
        sa.Column('cDescription', sa.Text(), nullable=True),
        sa.Column('nProposalNumber', sa.Integer(), nullable=False),
        sa.Column('tCreatedAt', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['nIdInitiativeType'], ['S03INITIATIVE_TYPE.nIdInitiativeType']),
        sa.ForeignKeyConstraint(['nIdParticipant'], ['S02PARTICIPANT.nIdParticipant']),
        sa.ForeignKeyConstraint(['nIdWorkshopTeam'], ['S02WORKSHOP_TEAM.nIdWorkshopTeam']),
        sa.PrimaryKeyConstraint('nIdProposal')
    )
    
    op.create_table('S03PROPOSAL_SELECTED',
        sa.Column('nIdProposalSelected', sa.Integer(), nullable=False),
        sa.Column('nIdProposal', sa.Integer(), nullable=True),
        sa.Column('nIdSelectingParticipant', sa.Integer(), nullable=True),
        sa.Column('tSelectedAt', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['nIdProposal'], ['S03PROPOSAL.nIdProposal']),
        sa.ForeignKeyConstraint(['nIdSelectingParticipant'], ['S02PARTICIPANT.nIdParticipant']),
        sa.PrimaryKeyConstraint('nIdProposalSelected'),
        sa.UniqueConstraint('nIdProposal')
    )
    
    op.create_table('S03PROPOSAL_EFFECTIVENESS',
        sa.Column('nIdProposalEffectiveness', sa.Integer(), nullable=False),
        sa.Column('nIdProposalSelected', sa.Integer(), nullable=True),
        sa.Column('nEffectivenessScore', sa.Integer(), nullable=True),
        sa.Column('cComments', sa.Text(), nullable=True),
        sa.Column('tEvaluatedAt', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['nIdProposalSelected'], ['S03PROPOSAL_SELECTED.nIdProposalSelected']),
        sa.PrimaryKeyConstraint('nIdProposalEffectiveness')
    )
    
    op.create_table('S03WORKSHOP_OBSERVATION_SESSION',
        sa.Column('nIdSession', sa.Integer(), nullable=False),
        sa.Column('nIdWorkshop', sa.Integer(), nullable=True),
        sa.Column('bIsActive', sa.Boolean(), nullable=True),
        sa.Column('tStartedAt', sa.DateTime(), nullable=True),
        sa.Column('tEndedAt', sa.DateTime(), nullable=True),
        sa.Column('tCreatedAt', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['nIdWorkshop'], ['S01WORKSHOP.nIdWorkshop']),
        sa.PrimaryKeyConstraint('nIdSession')
    )
    
    op.create_table('S03OBSERVATION_LOG',
        sa.Column('nIdObservationLog', sa.Integer(), nullable=False),
        sa.Column('nIdSession', sa.Integer(), nullable=True),
        sa.Column('nIdParticipant', sa.Integer(), nullable=True),
        sa.Column('nIdWorkshopTeam', sa.Integer(), nullable=True),
        sa.Column('nIdInitiativeType', sa.Integer(), nullable=True),
        sa.Column('cObservationNote', sa.Text(), nullable=True),
        sa.Column('tObservedAt', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['nIdInitiativeType'], ['S03INITIATIVE_TYPE.nIdInitiativeType']),
        sa.ForeignKeyConstraint(['nIdParticipant'], ['S02PARTICIPANT.nIdParticipant']),
        sa.ForeignKeyConstraint(['nIdSession'], ['S03WORKSHOP_OBSERVATION_SESSION.nIdSession']),
        sa.ForeignKeyConstraint(['nIdWorkshopTeam'], ['S02WORKSHOP_TEAM.nIdWorkshopTeam']),
        sa.PrimaryKeyConstraint('nIdObservationLog')
    )
    
    op.execute("INSERT INTO S03INITIATIVE_TYPE (cCode, cName, cDescription) VALUES ('PROPOSE_IDEA', 'Proponer Idea', 'El participante propone una nueva idea o solución')")
    op.execute("INSERT INTO S03INITIATIVE_TYPE (cCode, cName, cDescription) VALUES ('IDENTIFY_PROBLEM', 'Identificar Problema', 'El participante identifica un problema existente')")
    op.execute("INSERT INTO S03INITIATIVE_TYPE (cCode, cName, cDescription) VALUES ('PROACTIVE_WORK', 'Trabajo Proactivo', 'El participante realiza trabajo sin que el líder se lo pida')")
    op.execute("INSERT INTO S03INITIATIVE_TYPE (cCode, cName, cDescription) VALUES ('OPERATIONAL_WORK', 'Trabajo Operacional', 'El participante realiza trabajo después de que el líder se lo pide')")
    
    op.execute("INSERT INTO S03METRIC_CATALOG (cName, cDataType, cDescription) VALUES ('TOTAL_PROPOSALS', 'I', 'Cantidad total de propuestas lanzadas')")
    op.execute("INSERT INTO S03METRIC_CATALOG (cName, cDataType, cDescription) VALUES ('PROPOSALS_SELECTED', 'I', 'Cantidad de propuestas seleccionadas')")
    op.execute("INSERT INTO S03METRIC_CATALOG (cName, cDataType, cDescription) VALUES ('EFFECTIVENESS_AVG', 'F', 'Promedio de efectividad de propuestas')")
    op.execute("INSERT INTO S03METRIC_CATALOG (cName, cDataType, cDescription) VALUES ('INITIATIVE_COUNT', 'I', 'Conteo por tipo de iniciativa')")


def downgrade() -> None:
    op.drop_table('S03OBSERVATION_LOG')
    op.drop_table('S03WORKSHOP_OBSERVATION_SESSION')
    op.drop_table('S03PROPOSAL_EFFECTIVENESS')
    op.drop_table('S03PROPOSAL_SELECTED')
    op.drop_table('S03PROPOSAL')
    op.drop_table('S03INITIATIVE_TYPE')
    op.drop_table('S03METRIC_LOG')
    op.drop_table('S03METRIC_WORKSHOP')
    op.drop_table('S03METRIC_CATALOG')
    op.drop_table('S02WORKSHOP_TEAM_MEMBER')
    op.drop_table('S02WORKSHOP_TEAM')
    op.drop_table('S02PARTICIPANT_PROGRAM')
    op.drop_table('S02PARTICIPANT')
    op.drop_table('S02PERSON')
    op.drop_table('S01WORKSHOP')
    op.drop_table('S01PROGRAM')
    op.drop_table('S01VENUE')
    op.drop_table('S01VENUE_TYPE')
    op.drop_table('S02IDENTIFICATION_TYPE')
