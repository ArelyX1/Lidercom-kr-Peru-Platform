from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Date, DECIMAL, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class S02IdentificationType(Base):
    __tablename__ = "S02IDENTIFICATION_TYPE"
    
    nIdIdentificationType = Column(Integer, primary_key=True, index=True)
    cName = Column(String(100), nullable=True)
    isActive = Column(Boolean, default=True)
    tCreatedAt = Column(DateTime, server_default=func.now())


class S01VenueType(Base):
    __tablename__ = "S01VENUE_TYPE"
    
    nIdVenueType = Column(Integer, primary_key=True, index=True)
    cName = Column(String(100), nullable=True)
    isActive = Column(Boolean, default=True)
    tCreatedAt = Column(DateTime, server_default=func.now())


class S01Venue(Base):
    __tablename__ = "S01VENUE"
    
    nIdVenue = Column(Integer, primary_key=True, index=True)
    cName = Column(String(100), nullable=True)
    cDescription = Column(Text, nullable=True)
    cLogoUrl = Column(String(500), nullable=True)
    cEmail = Column(String(100), nullable=True)
    nLatitude = Column(DECIMAL(10, 8), nullable=True)
    nLongitude = Column(DECIMAL(10, 8), nullable=True)
    cIdBoundarie = Column(String(50), nullable=True)
    nIdVenueType = Column(Integer, ForeignKey("S01VENUE_TYPE.nIdVenueType"))
    bIsActive = Column(Boolean, default=True)
    tCreatedAt = Column(DateTime, server_default=func.now())
    tModifiedAt = Column(DateTime, nullable=True)
    
    venue_type = relationship("S01VenueType")
    programs = relationship("S01Program", back_populates="venue")


class S01Program(Base):
    __tablename__ = "S01PROGRAM"
    
    nIdProgram = Column(Integer, primary_key=True, index=True)
    nIdVenue = Column(Integer, ForeignKey("S01VENUE.nIdVenue"))
    cName = Column(String(200), nullable=True)
    cDescription = Column(Text, nullable=True)
    isActive = Column(Boolean, default=True)
    tCreatedAt = Column(DateTime, server_default=func.now())
    
    venue = relationship("S01Venue", back_populates="programs")
    workshops = relationship("S01Workshop", back_populates="program")


class S01Workshop(Base):
    __tablename__ = "S01WORKSHOP"
    
    nIdWorkshop = Column(Integer, primary_key=True, index=True)
    nIdProgram = Column(Integer, ForeignKey("S01PROGRAM.nIdProgram"))
    cName = Column(String(200), nullable=True)
    dDate = Column(Date, nullable=True)
    isActive = Column(Boolean, default=True)
    tCreatedAt = Column(DateTime, server_default=func.now())
    
    program = relationship("S01Program", back_populates="workshops")
    teams = relationship("S02WorkshopTeam", back_populates="workshop")
    metric_workshops = relationship("S03MetricWorkshop", back_populates="workshop")
    observation_sessions = relationship("S03WorkshopObservationSession", back_populates="workshop")


class S02Person(Base):
    __tablename__ = "S02PERSON"
    
    nIdPerson = Column(Integer, primary_key=True, index=True)
    nIdIdentificationType = Column(Integer, ForeignKey("S02IDENTIFICATION_TYPE.nIdIdentificationType"))
    cIdentificationNumber = Column(String(50), nullable=True)
    cFirstName = Column(String(100), nullable=True)
    cLastName = Column(String(100), nullable=True)
    cEmail = Column(String(150), nullable=True)
    cPhone = Column(String(20), nullable=True)
    tCreatedAt = Column(DateTime, server_default=func.now())
    
    identification_type = relationship("S02IdentificationType")
    participants = relationship("S02Participant", back_populates="person")


class S02Participant(Base):
    __tablename__ = "S02PARTICIPANT"
    
    nIdParticipant = Column(Integer, primary_key=True, index=True)
    nIdPerson = Column(Integer, ForeignKey("S02PERSON.nIdPerson"))
    isActive = Column(Boolean, default=True)
    tCreatedAt = Column(DateTime, server_default=func.now())
    
    person = relationship("S02Person", back_populates="participants")
    participant_programs = relationship("S02ParticipantProgram", back_populates="participant")
    team_members = relationship("S02WorkshopTeamMember", back_populates="participant")
    proposals = relationship("S03Proposal", back_populates="participant")
    observation_logs = relationship("S03ObservationLog", back_populates="participant")


class S02ParticipantProgram(Base):
    __tablename__ = "S02PARTICIPANT_PROGRAM"
    
    nIdParticipantProgram = Column(Integer, primary_key=True, index=True)
    nIdParticipant = Column(Integer, ForeignKey("S02PARTICIPANT.nIdParticipant"))
    nIdProgram = Column(Integer, ForeignKey("S01PROGRAM.nIdProgram"))
    tCreatedAt = Column(DateTime, server_default=func.now())
    
    participant = relationship("S02Participant", back_populates="participant_programs")
    program = relationship("S01Program")


class S02WorkshopTeam(Base):
    __tablename__ = "S02WORKSHOP_TEAM"
    
    nIdWorkshopTeam = Column(Integer, primary_key=True, index=True)
    nIdWorkshop = Column(Integer, ForeignKey("S01WORKSHOP.nIdWorkshop"))
    cTeamName = Column(String(100), nullable=True)
    tCreatedAt = Column(DateTime, server_default=func.now())
    
    workshop = relationship("S01Workshop", back_populates="teams")
    members = relationship("S02WorkshopTeamMember", back_populates="team")
    proposals = relationship("S03Proposal", back_populates="team")


class S02WorkshopTeamMember(Base):
    __tablename__ = "S02WORKSHOP_TEAM_MEMBER"
    
    nIdWorkshopTeamMember = Column(Integer, primary_key=True, index=True)
    nIdWorkshopTeam = Column(Integer, ForeignKey("S02WORKSHOP_TEAM.nIdWorkshopTeam"))
    nIdParticipant = Column(Integer, ForeignKey("S02PARTICIPANT.nIdParticipant"))
    tCreatedAt = Column(DateTime, server_default=func.now())
    
    team = relationship("S02WorkshopTeam", back_populates="members")
    participant = relationship("S02Participant", back_populates="team_members")


class S03MetricCatalog(Base):
    __tablename__ = "S03METRIC_CATALOG"
    
    nIdMetricCatalog = Column(Integer, primary_key=True, index=True)
    cName = Column(String(100), nullable=True)
    cDataType = Column(String(1), nullable=True)
    cDescription = Column(Text, nullable=True)
    isActive = Column(Boolean, default=True)
    tCreatedAt = Column(DateTime, server_default=func.now())
    
    metric_workshops = relationship("S03MetricWorkshop", back_populates="metric_catalog")


class S03MetricWorkshop(Base):
    __tablename__ = "S03METRIC_WORKSHOP"
    
    nIdMetricWorkshop = Column(Integer, primary_key=True, index=True)
    nIdWorkshop = Column(Integer, ForeignKey("S01WORKSHOP.nIdWorkshop"))
    nIdMetricCatalog = Column(Integer, ForeignKey("S03METRIC_CATALOG.nIdMetricCatalog"))
    isEnabled = Column(Boolean, default=True)
    tCreatedAt = Column(DateTime, server_default=func.now())
    
    workshop = relationship("S01Workshop", back_populates="metric_workshops")
    metric_catalog = relationship("S03MetricCatalog", back_populates="metric_workshops")
    metric_logs = relationship("S03MetricLog", back_populates="metric_workshop")


class S03MetricLog(Base):
    __tablename__ = "S03METRIC_LOG"
    
    tTimestamp = Column(DateTime, primary_key=True, server_default=func.now())
    nIdMetricLog = Column(Integer, primary_key=True, index=True)
    nIdParticipant = Column(Integer, ForeignKey("S02PARTICIPANT.nIdParticipant"))
    nIdMetricWorkshop = Column(Integer, ForeignKey("S03METRIC_WORKSHOP.nIdMetricWorkshop"))
    fValue = Column(DECIMAL, nullable=True)
    
    participant = relationship("S02Participant", back_populates="metric_logs")
    metric_workshop = relationship("S03MetricWorkshop", back_populates="metric_logs")


class S03InitiativeType(Base):
    __tablename__ = "S03INITIATIVE_TYPE"
    
    nIdInitiativeType = Column(Integer, primary_key=True, index=True)
    cCode = Column(String(50), unique=True, nullable=False)
    cName = Column(String(100), nullable=False)
    cDescription = Column(Text, nullable=True)
    isActive = Column(Boolean, default=True)
    tCreatedAt = Column(DateTime, server_default=func.now())
    
    proposals = relationship("S03Proposal", back_populates="initiative_type")
    observation_logs = relationship("S03ObservationLog", back_populates="initiative_type")


class S03Proposal(Base):
    __tablename__ = "S03PROPOSAL"
    
    nIdProposal = Column(Integer, primary_key=True, index=True)
    nIdWorkshopTeam = Column(Integer, ForeignKey("S02WORKSHOP_TEAM.nIdWorkshopTeam"))
    nIdParticipant = Column(Integer, ForeignKey("S02PARTICIPANT.nIdParticipant"))
    nIdInitiativeType = Column(Integer, ForeignKey("S03INITIATIVE_TYPE.nIdInitiativeType"))
    cTitle = Column(String(200), nullable=False)
    cDescription = Column(Text, nullable=True)
    nProposalNumber = Column(Integer, nullable=False)
    tCreatedAt = Column(DateTime, server_default=func.now())
    
    team = relationship("S02WorkshopTeam", back_populates="proposals")
    participant = relationship("S02Participant", back_populates="proposals")
    initiative_type = relationship("S03InitiativeType", back_populates="proposals")
    selected = relationship("S03ProposalSelected", back_populates="proposal", uselist=False)


class S03ProposalSelected(Base):
    __tablename__ = "S03PROPOSAL_SELECTED"
    
    nIdProposalSelected = Column(Integer, primary_key=True, index=True)
    nIdProposal = Column(Integer, ForeignKey("S03PROPOSAL.nIdProposal"), unique=True)
    nIdSelectingParticipant = Column(Integer, ForeignKey("S02PARTICIPANT.nIdParticipant"))
    tSelectedAt = Column(DateTime, server_default=func.now())
    
    proposal = relationship("S03Proposal", back_populates="selected")
    selecting_participant = relationship("S02Participant")
    effectiveness = relationship("S03ProposalEffectiveness", back_populates="proposal_selected", uselist=False)


class S03ProposalEffectiveness(Base):
    __tablename__ = "S03PROPOSAL_EFFECTIVENESS"
    
    nIdProposalEffectiveness = Column(Integer, primary_key=True, index=True)
    nIdProposalSelected = Column(Integer, ForeignKey("S03PROPOSAL_SELECTED.nIdProposalSelected"))
    nEffectivenessScore = Column(Integer)
    cComments = Column(Text, nullable=True)
    tEvaluatedAt = Column(DateTime, server_default=func.now())
    
    proposal_selected = relationship("S03ProposalSelected", back_populates="effectiveness")


class S03WorkshopObservationSession(Base):
    __tablename__ = "S03WORKSHOP_OBSERVATION_SESSION"
    
    nIdSession = Column(Integer, primary_key=True, index=True)
    nIdWorkshop = Column(Integer, ForeignKey("S01WORKSHOP.nIdWorkshop"))
    bIsActive = Column(Boolean, default=False)
    tStartedAt = Column(DateTime, nullable=True)
    tEndedAt = Column(DateTime, nullable=True)
    tCreatedAt = Column(DateTime, server_default=func.now())
    
    workshop = relationship("S01Workshop", back_populates="observation_sessions")
    observation_logs = relationship("S03ObservationLog", back_populates="session")


class S03ObservationLog(Base):
    __tablename__ = "S03OBSERVATION_LOG"
    
    nIdObservationLog = Column(Integer, primary_key=True, index=True)
    nIdSession = Column(Integer, ForeignKey("S03WORKSHOP_OBSERVATION_SESSION.nIdSession"))
    nIdParticipant = Column(Integer, ForeignKey("S02PARTICIPANT.nIdParticipant"))
    nIdWorkshopTeam = Column(Integer, ForeignKey("S02WORKSHOP_TEAM.nIdWorkshopTeam"))
    nIdInitiativeType = Column(Integer, ForeignKey("S03INITIATIVE_TYPE.nIdInitiativeType"))
    cObservationNote = Column(Text, nullable=True)
    tObservedAt = Column(DateTime, server_default=func.now())
    
    session = relationship("S03WorkshopObservationSession", back_populates="observation_logs")
    participant = relationship("S02Participant", back_populates="observation_logs")
    team = relationship("S02WorkshopTeam")
    initiative_type = relationship("S03InitiativeType", back_populates="observation_logs")
