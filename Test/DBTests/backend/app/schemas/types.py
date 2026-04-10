import strawberry
from typing import Optional, List
from datetime import datetime, date


@strawberry.type
class PersonType:
    nIdPerson: int
    cFirstName: Optional[str]
    cLastName: Optional[str]
    cEmail: Optional[str]


@strawberry.type
class ParticipantType:
    nIdParticipant: int
    person: Optional[PersonType]
    isActive: bool


@strawberry.type
class WorkshopTeamType:
    nIdWorkshopTeam: int
    cTeamName: Optional[str]


@strawberry.type
class WorkshopTeamMemberType:
    nIdWorkshopTeamMember: int
    participant: Optional[ParticipantType]
    team: Optional[WorkshopTeamType]


@strawberry.type
class WorkshopType:
    nIdWorkshop: int
    cName: Optional[str]
    dDate: Optional[date]


@strawberry.type
class ProgramType:
    nIdProgram: int
    cName: Optional[str]
    workshops: Optional[List[WorkshopType]]


@strawberry.type
class InitiativeTypeType:
    nIdInitiativeType: int
    cCode: str
    cName: str
    cDescription: Optional[str]


@strawberry.type
class ProposalType:
    nIdProposal: int
    cTitle: str
    cDescription: Optional[str]
    nProposalNumber: int
    participant: Optional[ParticipantType]
    initiative_type: Optional[InitiativeTypeType]
    tCreatedAt: datetime


@strawberry.type
class ProposalSelectedType:
    nIdProposalSelected: int
    proposal: Optional[ProposalType]
    selecting_participant: Optional[ParticipantType]
    tSelectedAt: datetime
    effectiveness: Optional["ProposalEffectivenessType"]


@strawberry.type
class ProposalEffectivenessType:
    nIdProposalEffectiveness: int
    nEffectivenessScore: int
    cComments: Optional[str]
    tEvaluatedAt: datetime


@strawberry.type
class ObservationSessionType:
    nIdSession: int
    bIsActive: bool
    tStartedAt: Optional[datetime]
    tEndedAt: Optional[datetime]


@strawberry.type
class ObservationLogType:
    nIdObservationLog: int
    participant: Optional[ParticipantType]
    team: Optional[WorkshopTeamType]
    initiative_type: Optional[InitiativeTypeType]
    cObservationNote: Optional[str]
    tObservedAt: datetime


@strawberry.type
class MetricCatalogType:
    nIdMetricCatalog: int
    cName: Optional[str]
    cDataType: Optional[str]
    cDescription: Optional[str]


@strawberry.type
class MetricWorkshopType:
    nIdMetricWorkshop: int
    metric_catalog: Optional[MetricCatalogType]
    isEnabled: bool


@strawberry.type
class MetricLogType:
    tTimestamp: datetime
    nIdMetricLog: int
    participant: Optional[ParticipantType]
    fValue: Optional[float]


@strawberry.type
class ParticipantProposalStats:
    nIdParticipant: int
    cParticipantName: str
    nTotalProposals: int
    nProposalsSelected: int
    fAverageEffectiveness: Optional[float]


@strawberry.type
class TeamProposalStats:
    nIdWorkshopTeam: int
    cTeamName: Optional[str]
    nTotalProposals: int
    proposals_by_participant: List[ParticipantProposalStats]


# INPUTS
@strawberry.input
class CreateProposalInput:
    nIdWorkshopTeam: int
    nIdParticipant: int
    nIdInitiativeType: int
    cTitle: str
    cDescription: Optional[str] = None


@strawberry.input
class SelectProposalInput:
    nIdProposal: int
    nIdSelectingParticipant: int


@strawberry.input
class EvaluateProposalInput:
    nIdProposalSelected: int
    nEffectivenessScore: int
    cComments: Optional[str] = None


@strawberry.input
class CreateObservationLogInput:
    nIdSession: int
    nIdParticipant: int
    nIdWorkshopTeam: int
    nIdInitiativeType: int
    cObservationNote: Optional[str] = None


# RESPONSES
@strawberry.type
class OperationResponse:
    success: bool
    message: str


@strawberry.type
class ProposalSelectedResponse:
    success: bool
    message: str
    proposal_selected: Optional[ProposalSelectedType] = None
