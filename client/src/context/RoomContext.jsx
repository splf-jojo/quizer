import { createContext, useContext, useMemo } from "react";

const RoomContext = createContext(null);

function participantKey(code) {
  return `quizzer:${code}:participant`;
}

function legacyParticipantKey(code) {
  return `quizzer_participant_${code}`;
}

function participantIdKey(code) {
  return `quizzer:${code}:participantId`;
}

function resultKey(code) {
  return `quizzer_result_${code}`;
}

export function RoomProvider({ children }) {
  function saveParticipant(code, participant) {
    if (participant?.id) {
      localStorage.setItem(participantIdKey(code), participant.id);
    }
    localStorage.setItem(participantKey(code), JSON.stringify(participant));
  }

  function getParticipant(code) {
    try {
      const participant = JSON.parse(localStorage.getItem(participantKey(code)) || "null");
      if (participant) {
        return participant;
      }

      const legacyParticipant = JSON.parse(localStorage.getItem(legacyParticipantKey(code)) || "null");
      if (legacyParticipant?.id) {
        saveParticipant(code, legacyParticipant);
        return legacyParticipant;
      }

      const participantId = getParticipantId(code);
      return participantId ? { id: participantId } : null;
    } catch {
      return null;
    }
  }

  function getParticipantId(code) {
    const participantId = localStorage.getItem(participantIdKey(code));
    if (participantId) {
      return participantId;
    }

    try {
      const legacyParticipant = JSON.parse(localStorage.getItem(legacyParticipantKey(code)) || "null");
      if (legacyParticipant?.id) {
        saveParticipant(code, legacyParticipant);
        return legacyParticipant.id;
      }
    } catch {
      return null;
    }

    return null;
  }

  function clearParticipant(code) {
    localStorage.removeItem(participantIdKey(code));
    localStorage.removeItem(participantKey(code));
    localStorage.removeItem(legacyParticipantKey(code));
  }

  function saveResult(code, result) {
    localStorage.setItem(resultKey(code), JSON.stringify(result));
  }

  function getResult(code) {
    try {
      return JSON.parse(localStorage.getItem(resultKey(code)) || "null");
    } catch {
      return null;
    }
  }

  const value = useMemo(
    () => ({
      saveParticipant,
      getParticipant,
      getParticipantId,
      clearParticipant,
      saveResult,
      getResult
    }),
    []
  );

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useRoomStore() {
  const value = useContext(RoomContext);
  if (!value) {
    throw new Error("useRoomStore must be used within RoomProvider");
  }

  return value;
}
