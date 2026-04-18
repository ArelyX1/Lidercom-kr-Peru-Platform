export const typeDefs = `#graphql
  scalar DateTime

  type Venue {
    id: ID!
    name: String!
    description: String
    address: String
    createdAt: DateTime
  }

  type Program {
    id: ID!
    name: String!
    description: String
    venue: Venue
    workshops: [Workshop!]!
    createdAt: DateTime
  }

  type Workshop {
    id: ID!
    name: String!
    date: String
    program: Program
    participants: [Participant!]!
    teams: [WorkshopTeam!]!
    activeSession: WorkshopSession
    sessions: [WorkshopSession!]!
    isActive: Boolean!
    createdAt: DateTime
  }

  type Participant {
    id: ID!
    name: String!
    email: String
    identificationNumber: String
    workshopTeams: [WorkshopTeam!]!
    createdAt: DateTime
  }

  type WorkshopTeam {
    id: ID!
    name: String!
    workshop: Workshop
    members: [Participant!]!
    createdAt: DateTime
  }

  type WorkshopSession {
    id: ID!
    workshop: Workshop
    isActive: Boolean!
    startedAt: DateTime
    endedAt: DateTime
    elapsedSeconds: Int
    observations: [Observation!]!
    createdAt: DateTime
  }

  type InitiativeType {
    id: ID!
    code: String!
    name: String!
    description: String
    isActive: Boolean!
  }

  type Observation {
    id: ID!
    session: WorkshopSession!
    participant: Participant!
    team: WorkshopTeam
    initiativeType: InitiativeType!
    value: Float
    elapsedSeconds: Int
    observedAt: DateTime!
  }

  type SessionMetrics {
    proposals: Int!
    acceptances: Int!
    eyeContact: Int!
    paraphrasing: Int!
    interruptions: Int!
    conflictsMediation: Int!
    conflictsNegotiation: Int!
    conflictsImposition: Int!
    totalObservations: Int!
  }

  type ParticipantMetrics {
    participant: Participant!
    metrics: SessionMetrics!
  }

  type WorkshopMetrics {
    session: WorkshopSession!
    totalMetrics: SessionMetrics!
    participantMetrics: [ParticipantMetrics!]!
  }

  type Query {
    venues: [Venue!]!
    venue(id: ID!): Venue

    programs(venueId: ID): [Program!]!
    program(id: ID!): Program

    workshops(programId: ID): [Workshop!]!
    workshop(id: ID!): Workshop
    activeWorkshop: Workshop

    participants(workshopId: ID): [Participant!]!
    participant(id: ID!): Participant

    teams(workshopId: ID!): [WorkshopTeam!]!
    team(id: ID!): WorkshopTeam

    sessions(workshopId: ID!): [WorkshopSession!]!
    activeSession: WorkshopSession

    initiativeTypes: [InitiativeType!]!

    observations(sessionId: ID!): [Observation!]!
    sessionMetrics(sessionId: ID!): WorkshopMetrics
  }

  input CreateVenueInput {
    name: String!
    description: String
    address: String
  }

  input CreateProgramInput {
    name: String!
    description: String
    venueId: ID!
  }

  input CreateWorkshopInput {
    name: String!
    date: String
    programId: ID!
  }

  input CreateParticipantInput {
    name: String!
    email: String
    identificationNumber: String
  }

  input CreateTeamInput {
    name: String!
    workshopId: ID!
  }

  input AddParticipantToTeamInput {
    participantId: ID!
    teamId: ID!
  }

  type Mutation {
    createVenue(input: CreateVenueInput!): Venue!
    updateVenue(id: ID!, name: String, description: String, address: String): Venue!
    deleteVenue(id: ID!): Boolean!

    createProgram(input: CreateProgramInput!): Program!
    updateProgram(id: ID!, name: String, description: String): Program!
    deleteProgram(id: ID!): Boolean!

    createWorkshop(input: CreateWorkshopInput!): Workshop!
    updateWorkshop(id: ID!, name: String, date: String): Workshop!
    deleteWorkshop(id: ID!): Boolean!

    createParticipant(input: CreateParticipantInput!): Participant!
    updateParticipant(id: ID!, name: String, email: String, identificationNumber: String): Participant!
    deleteParticipant(id: ID!): Boolean!

    createTeam(input: CreateTeamInput!): WorkshopTeam!
    addParticipantToTeam(input: AddParticipantToTeamInput!): WorkshopTeam!
    removeParticipantFromTeam(participantId: ID!, teamId: ID!): Boolean!

    startSession(workshopId: ID!): WorkshopSession!
    endSession(sessionId: ID!): WorkshopSession!

    logObservation(
      sessionId: ID!
      participantId: ID!
      teamId: ID
      initiativeTypeCode: String!
      value: Float
      elapsedSeconds: Int
    ): Observation!
  }
`;
