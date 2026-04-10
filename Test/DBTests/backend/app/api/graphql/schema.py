import strawberry
from typing import List, Optional
from sqlalchemy.orm import selectinload
from sqlalchemy import select

from app.schemas.types import (
    ProposalType, ProposalSelectedType, ProposalEffectivenessType,
    ObservationSessionType, ObservationLogType, MetricCatalogType,
    MetricWorkshopType, MetricLogType, ParticipantProposalStats, TeamProposalStats,
    InitiativeTypeType, ParticipantType, WorkshopTeamType, WorkshopType, ProgramType,
    CreateProposalInput, SelectProposalInput, EvaluateProposalInput, CreateObservationLogInput,
    OperationResponse, ProposalSelectedResponse
)
from app.services.services import ProposalService, ObservationService, MetricService
from app.db.database import async_session_maker


def convert_proposal(proposal) -> ProposalType:
    return ProposalType(
        nIdProposal=proposal.nIdProposal,
        cTitle=proposal.cTitle,
        cDescription=proposal.cDescription,
        nProposalNumber=proposal.nProposalNumber,
        participant=ParticipantType(
            nIdParticipant=proposal.participant.nIdParticipant,
            person=None,
            isActive=proposal.participant.isActive
        ) if proposal.participant else None,
        initiative_type=InitiativeTypeType(
            nIdInitiativeType=proposal.initiative_type.nIdInitiativeType,
            cCode=proposal.initiative_type.cCode,
            cName=proposal.initiative_type.cName,
            cDescription=proposal.initiative_type.cDescription
        ) if proposal.initiative_type else None,
        tCreatedAt=proposal.tCreatedAt
    )


def convert_proposal_selected(ps) -> ProposalSelectedType:
    return ProposalSelectedType(
        nIdProposalSelected=ps.nIdProposalSelected,
        proposal=convert_proposal(ps.proposal) if ps.proposal else None,
        selecting_participant=ParticipantType(
            nIdParticipant=ps.selecting_participant.nIdParticipant,
            person=None,
            isActive=ps.selecting_participant.isActive
        ) if ps.selecting_participant else None,
        tSelectedAt=ps.tSelectedAt,
        effectiveness=ProposalEffectivenessType(
            nIdProposalEffectiveness=ps.effectiveness.nIdProposalEffectiveness,
            nEffectivenessScore=ps.effectiveness.nEffectivenessScore,
            cComments=ps.effectiveness.cComments,
            tEvaluatedAt=ps.effectiveness.tEvaluatedAt
        ) if ps.effectiveness else None
    )


def convert_observation_session(session) -> ObservationSessionType:
    return ObservationSessionType(
        nIdSession=session.nIdSession,
        bIsActive=session.bIsActive,
        tStartedAt=session.tStartedAt,
        tEndedAt=session.tEndedAt
    )


def convert_observation_log(log) -> ObservationLogType:
    return ObservationLogType(
        nIdObservationLog=log.nIdObservationLog,
        participant=ParticipantType(
            nIdParticipant=log.participant.nIdParticipant,
            person=None,
            isActive=log.participant.isActive
        ) if log.participant else None,
        team=WorkshopTeamType(
            nIdWorkshopTeam=log.team.nIdWorkshopTeam,
            cTeamName=log.team.cTeamName
        ) if log.team else None,
        initiative_type=InitiativeTypeType(
            nIdInitiativeType=log.initiative_type.nIdInitiativeType,
            cCode=log.initiative_type.cCode,
            cName=log.initiative_type.cName,
            cDescription=log.initiative_type.cDescription
        ) if log.initiative_type else None,
        cObservationNote=log.cObservationNote,
        tObservedAt=log.tObservedAt
    )


@strawberry.type
class Query:
    @strawberry.field
    async def initiative_types(self) -> List[InitiativeTypeType]:
        async with async_session_maker() as session:
            from app.models.models import S03InitiativeType
            result = await session.execute(select(S03InitiativeType))
            types = result.scalars().all()
            return [
                InitiativeTypeType(
                    nIdInitiativeType=t.nIdInitiativeType,
                    cCode=t.cCode,
                    cName=t.cName,
                    cDescription=t.cDescription
                ) for t in types
            ]

    @strawberry.field
    async def proposals_by_team(self, workshop_team_id: int) -> List[ProposalType]:
        async with async_session_maker() as session:
            from app.models.models import S03Proposal
            result = await session.execute(
                select(S03Proposal).where(
                    S03Proposal.nIdWorkshopTeam == workshop_team_id
                ).options(
                    selectinload(S03Proposal.participant),
                    selectinload(S03Proposal.initiative_type)
                )
            )
            proposals = result.scalars().all()
            return [convert_proposal(p) for p in proposals]

    @strawberry.field
    async def proposal_selected(self, proposal_id: int) -> Optional[ProposalSelectedType]:
        async with async_session_maker() as session:
            from app.models.models import S03ProposalSelected
            result = await session.execute(
                select(S03ProposalSelected).where(
                    S03ProposalSelected.nIdProposal == proposal_id
                ).options(
                    selectinload(S03ProposalSelected.proposal).selectinload(S03Proposal.participant),
                    selectinload(S03ProposalSelected.proposal).selectinload(S03Proposal.initiative_type),
                    selectinload(S03ProposalSelected.selecting_participant),
                    selectinload(S03ProposalSelected.effectiveness)
                )
            )
            ps = result.scalar_one_or_none()
            return convert_proposal_selected(ps) if ps else None

    @strawberry.field
    async def team_proposal_stats(self, workshop_team_id: int) -> TeamProposalStats:
        async with async_session_maker() as session:
            from app.models.models import S02WorkshopTeam
            result = await session.execute(
                select(S02WorkshopTeam).where(S02WorkshopTeam.nIdWorkshopTeam == workshop_team_id)
            )
            team = result.scalar_one_or_none()
            
            service = ProposalService(session)
            stats = await service.get_participant_stats(workshop_team_id)
            
            return TeamProposalStats(
                nIdWorkshopTeam=team.nIdWorkshopTeam if team else workshop_team_id,
                cTeamName=team.cTeamName if team else None,
                nTotalProposals=sum(s["nTotalProposals"] for s in stats),
                proposals_by_participant=[
                    ParticipantProposalStats(
                        nIdParticipant=s["nIdParticipant"],
                        cParticipantName=s["cParticipantName"],
                        nTotalProposals=s["nTotalProposals"],
                        nProposalsSelected=s["nProposalsSelected"],
                        fAverageEffectiveness=s["fAverageEffectiveness"]
                    ) for s in stats
                ]
            )

    @strawberry.field
    async def observation_session(self, workshop_id: int) -> Optional[ObservationSessionType]:
        async with async_session_maker() as session:
            service = ObservationService(session)
            session_obj = await service.get_active_session(workshop_id)
            return convert_observation_session(session_obj) if session_obj else None

    @strawberry.field
    async def observation_logs(self, session_id: int) -> List[ObservationLogType]:
        async with async_session_maker() as session:
            from app.models.models import S03ObservationLog
            result = await session.execute(
                select(S03ObservationLog).where(
                    S03ObservationLog.nIdSession == session_id
                ).options(
                    selectinload(S03ObservationLog.participant),
                    selectinload(S03ObservationLog.team),
                    selectinload(S03ObservationLog.initiative_type)
                )
            )
            logs = result.scalars().all()
            return [convert_observation_log(log) for log in logs]

    @strawberry.field
    async def metric_catalogs(self) -> List[MetricCatalogType]:
        async with async_session_maker() as session:
            from app.models.models import S03MetricCatalog
            result = await session.execute(select(S03MetricCatalog))
            catalogs = result.scalars().all()
            return [
                MetricCatalogType(
                    nIdMetricCatalog=c.nIdMetricCatalog,
                    cName=c.cName,
                    cDataType=c.cDataType,
                    cDescription=c.cDescription
                ) for c in catalogs
            ]

    @strawberry.field
    async def metric_logs(self, participant_id: Optional[int] = None,
                          metric_workshop_id: Optional[int] = None) -> List[MetricLogType]:
        async with async_session_maker() as session:
            service = MetricService(session)
            logs = await service.get_metric_logs(participant_id, metric_workshop_id)
            return [
                MetricLogType(
                    tTimestamp=log.tTimestamp,
                    nIdMetricLog=log.nIdMetricLog,
                    participant=ParticipantType(
                        nIdParticipant=log.participant.nIdParticipant,
                        person=None,
                        isActive=log.participant.isActive
                    ) if log.participant else None,
                    fValue=float(log.fValue) if log.fValue else None
                ) for log in logs
            ]


@strawberry.type
class Mutation:
    @strawberry.mutation
    async def create_proposal(self, input: CreateProposalInput) -> ProposalSelectedResponse:
        async with async_session_maker() as session:
            try:
                service = ProposalService(session)
                proposal = await service.create_proposal(
                    workshop_team_id=input.nIdWorkshopTeam,
                    participant_id=input.nIdParticipant,
                    initiative_type_id=input.nIdInitiativeType,
                    title=input.cTitle,
                    description=input.cDescription
                )
                return ProposalSelectedResponse(
                    success=True,
                    message="Propuesta creada exitosamente",
                    proposal_selected=None
                )
            except Exception as e:
                return ProposalSelectedResponse(
                    success=False,
                    message=str(e)
                )

    @strawberry.mutation
    async def select_proposal(self, input: SelectProposalInput) -> ProposalSelectedResponse:
        async with async_session_maker() as session:
            try:
                service = ProposalService(session)
                proposal_selected = await service.select_proposal(
                    proposal_id=input.nIdProposal,
                    selecting_participant_id=input.nIdSelectingParticipant
                )
                
                await session.refresh(proposal_selected, ["proposal", "selecting_participant", "effectiveness"])
                
                return ProposalSelectedResponse(
                    success=True,
                    message="Propuesta seleccionada exitosamente",
                    proposal_selected=convert_proposal_selected(proposal_selected)
                )
            except Exception as e:
                return ProposalSelectedResponse(
                    success=False,
                    message=str(e)
                )

    @strawberry.mutation
    async def evaluate_proposal(self, input: EvaluateProposalInput) -> OperationResponse:
        async with async_session_maker() as session:
            try:
                service = ProposalService(session)
                await service.evaluate_proposal(
                    proposal_selected_id=input.nIdProposalSelected,
                    score=input.nEffectivenessScore,
                    comments=input.cComments
                )
                return OperationResponse(
                    success=True,
                    message="Evaluación registrada exitosamente"
                )
            except Exception as e:
                return OperationResponse(
                    success=False,
                    message=str(e)
                )

    @strawberry.mutation
    async def start_observation_session(self, workshop_id: int) -> ObservationSessionType:
        async with async_session_maker() as session:
            service = ObservationService(session)
            session_obj = await service.start_session(workshop_id)
            return convert_observation_session(session_obj)

    @strawberry.mutation
    async def end_observation_session(self, session_id: int) -> ObservationSessionType:
        async with async_session_maker() as session:
            service = ObservationService(session)
            session_obj = await service.end_session(session_id)
            return convert_observation_session(session_obj)

    @strawberry.mutation
    async def create_observation_log(self, input: CreateObservationLogInput) -> ObservationLogType:
        async with async_session_maker() as session:
            service = ObservationService(session)
            log = await service.create_observation_log(
                session_id=input.nIdSession,
                participant_id=input.nIdParticipant,
                team_id=input.nIdWorkshopTeam,
                initiative_type_id=input.nIdInitiativeType,
                note=input.cObservationNote
            )
            return convert_observation_log(log)


schema = strawberry.Schema(query=Query, mutation=Mutation)
