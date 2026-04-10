from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from datetime import datetime
from typing import List, Optional

from app.models.models import (
    S03Proposal, S03ProposalSelected, S03ProposalEffectiveness,
    S03ObservationLog, S03WorkshopObservationSession, S03InitiativeType,
    S02Participant, S02Person, S02WorkshopTeam,
    S03MetricLog, S03MetricWorkshop, S03MetricCatalog,
    S01Workshop, S01Program
)


class ProposalService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_proposal(self, workshop_team_id: int, participant_id: int,
                               initiative_type_id: int, title: str,
                               description: Optional[str] = None) -> S03Proposal:
        result = await self.session.execute(
            select(func.max(S03Proposal.nProposalNumber)).where(
                S03Proposal.nIdWorkshopTeam == workshop_team_id
            )
        )
        max_number = result.scalar() or 0
        
        proposal = S03Proposal(
            nIdWorkshopTeam=workshop_team_id,
            nIdParticipant=participant_id,
            nIdInitiativeType=initiative_type_id,
            cTitle=title,
            cDescription=description,
            nProposalNumber=max_number + 1
        )
        self.session.add(proposal)
        await self.session.commit()
        await self.session.refresh(proposal)
        
        await self._log_proposal_metric(proposal)
        
        return proposal

    async def _log_proposal_metric(self, proposal: S03Proposal):
        result = await self.session.execute(
            select(S01Workshop).where(
                S01Workshop.nIdWorkshop == S02WorkshopTeam.nIdWorkshop,
                S02WorkshopTeam.nIdWorkshopTeam == proposal.nIdWorkshopTeam
            ).join(S02WorkshopTeam)
        )
        workshop = result.scalar_one_or_none()
        
        if not workshop:
            return
            
        metric_result = await self.session.execute(
            select(S03MetricWorkshop).where(
                S03MetricWorkshop.nIdWorkshop == workshop.nIdWorkshop,
                S03MetricWorkshop.isEnabled == True
            ).options(selectinload(S03MetricWorkshop.metric_catalog))
        )
        metrics = metric_result.scalars().all()
        
        for metric in metrics:
            if metric.metric_catalog and metric.metric_catalog.cName == "TOTAL_PROPOSALS":
                log = S03MetricLog(
                    nIdParticipant=proposal.nIdParticipant,
                    nIdMetricWorkshop=metric.nIdMetricWorkshop,
                    fValue=1
                )
                self.session.add(log)
        
        await self.session.commit()

    async def select_proposal(self, proposal_id: int, selecting_participant_id: int) -> S03ProposalSelected:
        proposal_selected = S03ProposalSelected(
            nIdProposal=proposal_id,
            nIdSelectingParticipant=selecting_participant_id
        )
        self.session.add(proposal_selected)
        await self.session.commit()
        await self.session.refresh(proposal_selected)
        
        await self._log_selection_metric(proposal_selected)
        
        return proposal_selected

    async def _log_selection_metric(self, proposal_selected: S03ProposalSelected):
        result = await self.session.execute(
            select(S03Proposal).where(S03Proposal.nIdProposal == proposal_selected.nIdProposal)
        )
        proposal = result.scalar_one_or_none()
        
        if not proposal:
            return
            
        metric_result = await self.session.execute(
            select(S03MetricWorkshop).where(
                S03MetricWorkshop.nIdWorkshop == S02WorkshopTeam.nIdWorkshop,
                S03MetricWorkshop.isEnabled == True
            ).join(S02WorkshopTeam, S02WorkshopTeam.nIdWorkshopTeam == proposal.nIdWorkshopTeam)
        )
        metrics = metric_result.scalars().all()
        
        for metric in metrics:
            if metric.metric_catalog and metric.metric_catalog.cName == "PROPOSALS_SELECTED":
                log = S03MetricLog(
                    nIdParticipant=proposal.nIdParticipant,
                    nIdMetricWorkshop=metric.nIdMetricWorkshop,
                    fValue=1
                )
                self.session.add(log)
        
        await self.session.commit()

    async def evaluate_proposal(self, proposal_selected_id: int, score: int,
                                comments: Optional[str] = None) -> S03ProposalEffectiveness:
        effectiveness = S03ProposalEffectiveness(
            nIdProposalSelected=proposal_selected_id,
            nEffectivenessScore=score,
            cComments=comments
        )
        self.session.add(effectiveness)
        await self.session.commit()
        await self.session.refresh(effectiveness)
        
        await self._log_effectiveness_metric(proposal_selected_id, score)
        
        return effectiveness

    async def _log_effectiveness_metric(self, proposal_selected_id: int, score: int):
        result = await self.session.execute(
            select(S03ProposalSelected).where(
                S03ProposalSelected.nIdProposalSelected == proposal_selected_id
            ).options(selectinload(S03ProposalSelected.proposal))
        )
        proposal_selected = result.scalar_one_or_none()
        
        if not proposal_selected or not proposal_selected.proposal:
            return
            
        metric_result = await self.session.execute(
            select(S03MetricWorkshop).where(
                S03MetricWorkshop.nIdWorkshop == S02WorkshopTeam.nIdWorkshop,
                S03MetricWorkshop.isEnabled == True
            ).join(S02WorkshopTeam, S02WorkshopTeam.nIdWorkshopTeam == proposal_selected.proposal.nIdWorkshopTeam)
        )
        metrics = metric_result.scalars().all()
        
        for metric in metrics:
            if metric.metric_catalog and metric.metric_catalog.cName == "EFFECTIVENESS_AVG":
                log = S03MetricLog(
                    nIdParticipant=proposal_selected.proposal.nIdParticipant,
                    nIdMetricWorkshop=metric.nIdMetricWorkshop,
                    fValue=float(score)
                )
                self.session.add(log)
        
        await self.session.commit()

    async def get_participant_stats(self, workshop_team_id: int) -> List[dict]:
        result = await self.session.execute(
            select(S02Participant).join(S02WorkshopTeamMember).where(
                S02WorkshopTeamMember.nIdWorkshopTeam == workshop_team_id
            ).options(selectinload(S02Participant.person))
        )
        participants = result.scalars().all()
        
        stats = []
        for participant in participants:
            proposals_result = await self.session.execute(
                select(func.count(S03Proposal.nIdProposal)).where(
                    S03Proposal.nIdParticipant == participant.nIdParticipant,
                    S03Proposal.nIdWorkshopTeam == workshop_team_id
                )
            )
            total_proposals = proposals_result.scalar() or 0
            
            selected_result = await self.session.execute(
                select(func.count(S03ProposalSelected.nIdProposalSelected)).join(S03Proposal).where(
                    S03Proposal.nIdParticipant == participant.nIdParticipant,
                    S03Proposal.nIdWorkshopTeam == workshop_team_id
                )
            )
            proposals_selected = selected_result.scalar() or 0
            
            effectiveness_result = await self.session.execute(
                select(func.avg(S03ProposalEffectiveness.nEffectivenessScore)).join(
                    S03ProposalSelected
                ).join(S03Proposal).where(
                    S03Proposal.nIdParticipant == participant.nIdParticipant,
                    S03Proposal.nIdWorkshopTeam == workshop_team_id
                )
            )
            avg_effectiveness = effectiveness_result.scalar()
            
            person = participant.person
            name = f"{person.cFirstName or ''} {person.cLastName or ''}".strip()
            
            stats.append({
                "nIdParticipant": participant.nIdParticipant,
                "cParticipantName": name,
                "nTotalProposals": total_proposals,
                "nProposalsSelected": proposals_selected,
                "fAverageEffectiveness": float(avg_effectiveness) if avg_effectiveness else None
            })
        
        return stats


class ObservationService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def start_session(self, workshop_id: int) -> S03WorkshopObservationSession:
        result = await self.session.execute(
            select(S03WorkshopObservationSession).where(
                S03WorkshopObservationSession.nIdWorkshop == workshop_id,
                S03WorkshopObservationSession.bIsActive == True
            )
        )
        active_session = result.scalar_one_or_none()
        
        if active_session:
            return active_session
        
        session = S03WorkshopObservationSession(
            nIdWorkshop=workshop_id,
            bIsActive=True,
            tStartedAt=datetime.now()
        )
        self.session.add(session)
        await self.session.commit()
        await self.session.refresh(session)
        return session

    async def end_session(self, session_id: int) -> S03WorkshopObservationSession:
        result = await self.session.execute(
            select(S03WorkshopObservationSession).where(
                S03WorkshopObservationSession.nIdSession == session_id
            )
        )
        session = result.scalar_one_or_none()
        
        if session:
            session.bIsActive = False
            session.tEndedAt = datetime.now()
            await self.session.commit()
            await self.session.refresh(session)
            
            await self._log_initiative_metrics(session)
        
        return session

    async def _log_initiative_metrics(self, obs_session: S03WorkshopObservationSession):
        metric_result = await self.session.execute(
            select(S03MetricWorkshop).where(
                S03MetricWorkshop.nIdWorkshop == obs_session.nIdWorkshop,
                S03MetricWorkshop.isEnabled == True
            ).options(selectinload(S03MetricWorkshop.metric_catalog))
        )
        metrics = metric_result.scalars().all()
        
        initiative_counts = {}
        for log in obs_session.observation_logs:
            it_id = log.nIdInitiativeType
            initiative_counts[it_id] = initiative_counts.get(it_id, 0) + 1
        
        for metric in metrics:
            if metric.metric_catalog and metric.metric_catalog.cName == "INITIATIVE_COUNT":
                for it_id, count in initiative_counts.items():
                    log = S03MetricLog(
                        nIdParticipant=observation_logs[0].nIdParticipant if (observation_logs := list(obs_session.observation_logs)) else None,
                        nIdMetricWorkshop=metric.nIdMetricWorkshop,
                        fValue=float(count)
                    )
                    self.session.add(log)
        
        await self.session.commit()

    async def create_observation_log(self, session_id: int, participant_id: int,
                                      team_id: int, initiative_type_id: int,
                                      note: Optional[str] = None) -> S03ObservationLog:
        obs_log = S03ObservationLog(
            nIdSession=session_id,
            nIdParticipant=participant_id,
            nIdWorkshopTeam=team_id,
            nIdInitiativeType=initiative_type_id,
            cObservationNote=note
        )
        self.session.add(obs_log)
        await self.session.commit()
        await self.session.refresh(obs_log)
        return obs_log

    async def get_active_session(self, workshop_id: int) -> Optional[S03WorkshopObservationSession]:
        result = await self.session.execute(
            select(S03WorkshopObservationSession).where(
                S03WorkshopObservationSession.nIdWorkshop == workshop_id,
                S03WorkshopObservationSession.bIsActive == True
            )
        )
        return result.scalar_one_or_none()


class MetricService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_metrics_by_workshop(self, workshop_id: int) -> List[S03MetricWorkshop]:
        result = await self.session.execute(
            select(S03MetricWorkshop).where(
                S03MetricWorkshop.nIdWorkshop == workshop_id
            ).options(selectinload(S03MetricWorkshop.metric_catalog))
        )
        return result.scalars().all()

    async def get_metric_logs(self, participant_id: Optional[int] = None,
                               metric_workshop_id: Optional[int] = None) -> List[S03MetricLog]:
        query = select(S03MetricLog)
        
        if participant_id:
            query = query.where(S03MetricLog.nIdParticipant == participant_id)
        if metric_workshop_id:
            query = query.where(S03MetricLog.nIdMetricWorkshop == metric_workshop_id)
        
        result = await self.session.execute(
            query.options(
                selectinload(S03MetricLog.participant).selectinload(S02Participant.person)
            )
        )
        return result.scalars().all()
