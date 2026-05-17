"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ChatSidebar from "../components/ChatSidebar";
import ChatWindow from "../components/ChatWindow";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useRoleProtection, LoadingScreen } from "../components/RoleBasedRedirect";
import {
  deleteConversation,
  getConversationMessages,
  getMyConversations,
  sendConversationMessage,
  startConversation,
  uploadChatAttachment,
} from "../lib/api";

const API_BASE = "/api";
const SOCKET_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "") ||
  "https://golo-backend-new.onrender.com";
const CALL_ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

const formatCallDuration = (value) => {
  const total = Math.max(0, Number(value) || 0);
  const mins = String(Math.floor(total / 60)).padStart(2, "0");
  const secs = String(total % 60).padStart(2, "0");
  return `${mins}:${secs}`;
};

const getCallEventMeta = ({ status, durationSec = 0, isOutgoing = false }) => {
  if (status === "missed") {
    return {
      label: isOutgoing ? "Outgoing call not answered" : "Missed voice call",
      summary: "Missed call",
    };
  }

  if (status === "rejected") {
    return {
      label: isOutgoing ? "Call declined by user" : "You declined the call",
      summary: "Call declined",
    };
  }

  if (status === "busy") {
    return {
      label: isOutgoing ? "User is busy on another call" : "Line is busy",
      summary: "Call busy",
    };
  }

  if (status === "failed") {
    return {
      label: "Call failed",
      summary: "Call failed",
    };
  }

  if (status === "ended") {
    const base = isOutgoing ? "Outgoing call" : "Incoming call";
    if ((durationSec || 0) > 0) {
      const duration = formatCallDuration(durationSec);
      return {
        label: `${base} (${duration})`,
        summary: `Call ${duration}`,
      };
    }
    return {
      label: base,
      summary: "Call ended",
    };
  }

  return {
    label: "Call update",
    summary: "Call",
  };
};

export default function ChatsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-600">
          Loading chats...
        </div>
      }
    >
      <ChatsPageContent />
    </Suspense>
  );
}

function ChatsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { isLoading, isAuthorized } = useRoleProtection("user");

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [pageError, setPageError] = useState("");
  const [typingMap, setTypingMap] = useState({});
  const [presenceMap, setPresenceMap] = useState({});
  const [callUi, setCallUi] = useState({
    status: "idle",
    callId: null,
    direction: null,
    peerUserId: null,
    peerName: "",
    conversationId: null,
  });
  const [incomingCall, setIncomingCall] = useState(null);
  const [callError, setCallError] = useState("");
  const [isCallRecovering, setIsCallRecovering] = useState(false);
  const [callDurationSec, setCallDurationSec] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);

  const socketRef = useRef(null);
  const callSocketRef = useRef(null);
  const selectedConversationIdRef = useRef(null);
  const typingStopTimeoutRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  const remoteAudioRef = useRef(null);
  const conversationsRef = useRef([]);
  const callUiRef = useRef(callUi);
  const userIdRef = useRef(null);
  const audioContextRef = useRef(null);
  const ringIntervalRef = useRef(null);
  const vibrateIntervalRef = useRef(null);
  const callRecoveryTimeoutRef = useRef(null);
  const callRecoveryAttemptRef = useRef(0);
  const incomingCallNotificationRef = useRef(null);
  const pendingAutoCallRef = useRef(false);

  const joinSelectedConversationRoom = () => {
    const activeConversationId = selectedConversationIdRef.current;
    if (!socketRef.current?.connected || !activeConversationId) return;
    socketRef.current.emit("join_conversation", { conversationId: activeConversationId });
    socketRef.current.emit("mark_read", { conversationId: activeConversationId });
  };

  const adId = searchParams.get("adId");
  const sellerId = searchParams.get("sellerId");
  const autoCall = searchParams.get("autoCall") === "1";

  const selectedConversationId = useMemo(
    () => selectedConversation?.id || null,
    [selectedConversation]
  );

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  useEffect(() => {
    pendingAutoCallRef.current = autoCall;
  }, [autoCall]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    callUiRef.current = callUi;
  }, [callUi]);

  useEffect(() => {
    userIdRef.current = user?.id || null;
  }, [user?.id]);

  const getUserNameById = (userId) => {
    if (!userId) return "User";
    const found = conversationsRef.current.find(
      (item) => String(item?.otherUser?.id) === String(userId)
    );
    return found?.otherUser?.name || "User";
  };

  const getAudioContext = () => {
    if (typeof window === "undefined") return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioCtx();
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume().catch(() => {
        // Ignore resume errors for restricted autoplay contexts
      });
    }
    return audioContextRef.current;
  };

  const clearCallRecoveryTimeout = () => {
    if (callRecoveryTimeoutRef.current) {
      clearTimeout(callRecoveryTimeoutRef.current);
      callRecoveryTimeoutRef.current = null;
    }
  };

  const scheduleCallRecoveryTimeout = () => {
    clearCallRecoveryTimeout();
    callRecoveryTimeoutRef.current = setTimeout(() => {
      resetCallUi({ error: "Call connection lost due to network instability." });
    }, 12000);
  };

  const closeIncomingNotification = () => {
    if (incomingCallNotificationRef.current) {
      incomingCallNotificationRef.current.close();
      incomingCallNotificationRef.current = null;
    }
  };

  const requestNotificationAccess = async () => {
    if (typeof window === "undefined" || !window.Notification) return "unsupported";
    if (window.Notification.permission !== "default") return window.Notification.permission;
    try {
      return await window.Notification.requestPermission();
    } catch {
      return "denied";
    }
  };

  const playTone = (freq = 440, durationMs = 180, type = "sine", gainValue = 0.05) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(gainValue, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000 + 0.02);
  };

  const playDualToneBurst = ({
    freqA,
    freqB,
    durationMs = 380,
    gainValue = 0.06,
  }) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const master = ctx.createGain();
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 1200;
    bandpass.Q.value = 0.9;

    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(gainValue, ctx.currentTime + 0.025);
    master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);

    master.connect(bandpass);
    bandpass.connect(ctx.destination);

    const oscA = ctx.createOscillator();
    oscA.type = "triangle";
    oscA.frequency.setValueAtTime(freqA, ctx.currentTime);
    oscA.detune.value = -4;
    const lfoA = ctx.createOscillator();
    const lfoGainA = ctx.createGain();
    lfoA.frequency.value = 5.2;
    lfoGainA.gain.value = 4.8;
    lfoA.connect(lfoGainA);
    lfoGainA.connect(oscA.frequency);
    oscA.connect(master);

    const oscB = ctx.createOscillator();
    oscB.type = "square";
    oscB.frequency.setValueAtTime(freqB, ctx.currentTime);
    oscB.detune.value = 3;
    const lfoB = ctx.createOscillator();
    const lfoGainB = ctx.createGain();
    lfoB.frequency.value = 5.2;
    lfoGainB.gain.value = 4.2;
    lfoB.connect(lfoGainB);
    lfoGainB.connect(oscB.frequency);
    oscB.connect(master);

    oscA.start();
    oscB.start();
    lfoA.start();
    lfoB.start();

    const stopAt = ctx.currentTime + durationMs / 1000 + 0.05;
    oscA.stop(stopAt);
    oscB.stop(stopAt);
    lfoA.stop(stopAt);
    lfoB.stop(stopAt);
  };

  const stopRingtone = () => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (vibrateIntervalRef.current) {
      clearInterval(vibrateIntervalRef.current);
      vibrateIntervalRef.current = null;
    }
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(0);
    }
  };

  const startRingtone = (mode = "incoming") => {
    stopRingtone();
    const pattern = () => {
      if (mode === "incoming") {
        // Classic phone cadence: ring-ring, then pause.
        playDualToneBurst({ freqA: 440, freqB: 480, durationMs: 390, gainValue: 0.062 });
        setTimeout(() => {
          playDualToneBurst({ freqA: 440, freqB: 480, durationMs: 390, gainValue: 0.062 });
        }, 430);
      } else {
        playTone(480, 200, "triangle", 0.05);
      }
    };
    pattern();
    ringIntervalRef.current = setInterval(pattern, mode === "incoming" ? 2600 : 1400);

    if (mode === "incoming" && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([200, 150, 200]);
      vibrateIntervalRef.current = setInterval(() => {
        navigator.vibrate([200, 150, 200]);
      }, 2600);
    }
  };

  const showIncomingCallNotification = async ({ callerName, callId }) => {
    if (typeof document === "undefined") return;
    if (document.visibilityState === "visible") return;

    const permission = await requestNotificationAccess();
    if (permission !== "granted" || typeof window === "undefined" || !window.Notification) return;

    closeIncomingNotification();

    const notification = new window.Notification("Incoming call", {
      body: `${callerName || "User"} is calling you`,
      tag: `incoming-call-${callId}`,
      renotify: true,
      requireInteraction: true,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    incomingCallNotificationRef.current = notification;
  };

  const attemptCallRecovery = async (socket) => {
    const current = callUiRef.current;
    const now = Date.now();
    if (!current?.callId || !current?.peerUserId) return;
    if (!["connecting", "in-call", "calling"].includes(current.status)) return;
    if (now - callRecoveryAttemptRef.current < 1300) return;

    callRecoveryAttemptRef.current = now;

    try {
      const peerConnection = await createPeerConnection({
        callId: current.callId,
        targetUserId: current.peerUserId,
      });

      if (current.status === "calling") {
        return;
      }

      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        iceRestart: true,
      });
      await peerConnection.setLocalDescription(offer);

      socket?.emit("webrtc_offer", {
        callId: current.callId,
        targetUserId: current.peerUserId,
        signal: offer,
      });

      setCallUi((prev) => ({ ...prev, status: "connecting" }));
      setCallError("Reconnecting call...");
      setIsCallRecovering(true);
      scheduleCallRecoveryTimeout();
    } catch {
      setCallError("Reconnection attempt failed. Retrying...");
    }
  };

  const playConnectedTone = () => {
    stopRingtone();
    playTone(820, 120, "triangle", 0.06);
    setTimeout(() => playTone(980, 120, "triangle", 0.06), 140);
  };

  const playEndedTone = () => {
    stopRingtone();
    playTone(420, 180, "sawtooth", 0.05);
    setTimeout(() => playTone(300, 220, "sawtooth", 0.05), 180);
  };

  const appendCallEventToMessages = ({ conversationId, callId, status, durationSec = 0, callerId }) => {
    if (!conversationId || conversationId !== selectedConversationIdRef.current) return;

    const isOutgoing = String(callerId || userIdRef.current) === String(userIdRef.current);
    const meta = getCallEventMeta({ status, durationSec, isOutgoing });

    const eventMessage = {
      id: `call-${callId}-${status}`,
      createdAt: new Date().toISOString(),
      senderId: callerId || callUiRef.current.peerUserId || userIdRef.current,
      text: "",
      attachments: [],
      __kind: "call_event",
      callEvent: {
        callId,
        status,
        durationSec,
        isOutgoing,
        label: meta.label,
        summary: meta.summary,
      },
    };

    setMessages((prev) => {
      const exists = prev.some((item) => String(item.id) === String(eventMessage.id));
      if (exists) return prev;
      return [...prev, eventMessage];
    });
  };

  const updateConversationFromCallEvent = ({ conversationId, status, durationSec = 0, callerId }) => {
    if (!conversationId) return;
    const isOutgoing = String(callerId || userIdRef.current) === String(userIdRef.current);
    const summaryText = getCallEventMeta({ status, durationSec, isOutgoing }).summary;

    setConversations((prev) =>
      prev
        .map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                lastMessageText: summaryText,
                lastMessageAt: new Date().toISOString(),
              }
            : conversation
        )
        .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
    );
  };

  const emitWithAck = (socket, eventName, payload, timeoutMs = 6000) =>
    new Promise((resolve, reject) => {
      if (!socket?.connected) {
        reject(new Error("Realtime call connection is not ready."));
        return;
      }

      const timer = setTimeout(() => {
        reject(new Error(`${eventName} timed out`));
      }, timeoutMs);

      socket.emit(eventName, payload, (ack) => {
        clearTimeout(timer);
        if (!ack || ack.success === false) {
          reject(new Error(ack?.message || `Failed to run ${eventName}`));
          return;
        }
        resolve(ack.data || {});
      });
    });

  const stopLocalMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
  };

  const closePeerConnection = () => {
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.ontrack = null;
        peerConnectionRef.current.onicecandidate = null;
        peerConnectionRef.current.onconnectionstatechange = null;
        peerConnectionRef.current.close();
      } catch {
        // Ignore peer close errors during teardown
      }
      peerConnectionRef.current = null;
    }
    pendingIceCandidatesRef.current = [];
  };

  const clearCallResources = () => {
    closePeerConnection();
    stopLocalMedia();
    setRemoteStream(null);
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    setIsMuted(false);
    setCallDurationSec(0);
  };

  const resetCallUi = ({ error = "" } = {}) => {
    stopRingtone();
    closeIncomingNotification();
    clearCallRecoveryTimeout();
    clearCallResources();
    setIncomingCall(null);
    setIsCallRecovering(false);
    setCallUi({
      status: "idle",
      callId: null,
      direction: null,
      peerUserId: null,
      peerName: "",
      conversationId: null,
    });
    if (error) {
      setCallError(error);
      return;
    }
    setCallError("");
  };

  const ensureLocalStream = async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    localStreamRef.current = stream;
    setIsMuted(false);
    return stream;
  };

  const flushPendingIceCandidates = async (peerConnection) => {
    if (!pendingIceCandidatesRef.current.length) return;
    const queued = [...pendingIceCandidatesRef.current];
    pendingIceCandidatesRef.current = [];
    for (const candidate of queued) {
      try {
        await peerConnection.addIceCandidate(candidate);
      } catch {
        // Ignore stale ICE candidates after teardown
      }
    }
  };

  const createPeerConnection = async ({ callId, targetUserId }) => {
    if (peerConnectionRef.current) return peerConnectionRef.current;

    const peerConnection = new RTCPeerConnection({ iceServers: CALL_ICE_SERVERS });
    const localStream = await ensureLocalStream();

    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
      const stream = event.streams?.[0];
      if (stream) {
        setRemoteStream(stream);
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (!event.candidate) return;
      callSocketRef.current?.emit("webrtc_ice_candidate", {
        callId,
        targetUserId,
        signal: event.candidate,
      });
    };

    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      if (state === "connected") {
        clearCallRecoveryTimeout();
        setIsCallRecovering(false);
        setCallError("");
        setCallUi((prev) => (prev.status === "in-call" ? prev : { ...prev, status: "in-call" }));
      }
      if (state === "disconnected") {
        setIsCallRecovering(true);
        setCallError("Network unstable. Recovering call...");
        scheduleCallRecoveryTimeout();
        attemptCallRecovery(callSocketRef.current);
      }
      if (state === "failed" || state === "closed") {
        resetCallUi({ error: "Call disconnected." });
      }
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/chats");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadConversations = async () => {
      setLoadingConversations(true);
      setPageError("");
      try {
        const response = await getMyConversations();
        const items = response?.data || [];
        setConversations(items);

        if (adId) {
          const started = await startConversation({ adId, sellerId: sellerId || undefined });
          const conversation = started?.data;

          if (conversation) {
            setConversations((prev) => {
              const exists = prev.find((item) => item.id === conversation.id);
              if (exists) {
                return prev.map((item) => (item.id === conversation.id ? conversation : item));
              }
              return [conversation, ...prev];
            });
            setSelectedConversation(conversation);
            router.replace("/chats");
            return;
          }
        }

        if (items.length > 0) {
          setSelectedConversation(items[0]);
        }
      } catch (error) {
        setPageError(error?.data?.message || error.message || "Failed to load chats.");
      } finally {
        setLoadingConversations(false);
      }
    };

    loadConversations();
  }, [isAuthenticated, adId, sellerId, router]);

  useEffect(() => {
    if (!pendingAutoCallRef.current) return;
    if (!selectedConversationId || !selectedConversation?.otherUser?.id) return;
    if (!callSocketRef.current?.connected) return;
    if (callUiRef.current.status !== 'idle') return;

    pendingAutoCallRef.current = false;
    handleStartCall();
  }, [selectedConversationId, selectedConversation]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      setLoadingMessages(true);
      setPageError("");
      try {
        const response = await getConversationMessages(selectedConversationId, { page: 1, limit: 100 });
        setMessages(response?.data?.items || []);
      } catch (error) {
        setPageError(error?.data?.message || error.message || "Failed to load messages.");
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [selectedConversationId]);

  useEffect(() => {
    if (!isAuthenticated || typeof document === "undefined") return;

    requestNotificationAccess().catch(() => {
      // Ignore notification permission errors
    });

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        closeIncomingNotification();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || typeof window === "undefined") return;

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    let mounted = true;

    const setupSocket = async () => {
      const { io } = await import("socket.io-client");
      if (!mounted) return;

      const socket = io(`${SOCKET_BASE_URL}/chat`, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 20,
        reconnectionDelay: 1000,
        auth: {
          token,
        },
      });

      socket.on("connect", () => {
        setPageError("");
        joinSelectedConversationRoom();
      });

      socket.on("connect_error", () => {
        setPageError("Realtime connection failed. Messages still work via API.");
      });

      socket.on("new_message", (incoming) => {
        if (incoming.conversationId === selectedConversationIdRef.current) {
          setMessages((prev) => {
            const exists = prev.some((item) => item.id === incoming.id);
            if (exists) return prev;
            return [...prev, incoming];
          });
        }

        setConversations((prev) =>
          prev
            .map((conversation) =>
              conversation.id === incoming.conversationId
                ? {
                    ...conversation,
                    lastMessageText: incoming.text || (incoming.attachments?.length ? "📎 Attachment" : ""),
                    lastMessageAt: incoming.createdAt,
                    lastMessageAdId: incoming.adId || conversation.lastMessageAdId,
                    lastMessageAdTitle: incoming.adTitle || conversation.lastMessageAdTitle,
                    ad: conversation.ad
                      ? {
                          ...conversation.ad,
                          id: incoming.adId || conversation.ad.id,
                          title: incoming.adTitle || conversation.ad.title,
                        }
                      : conversation.ad,
                  }
                : conversation
            )
            .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
        );
      });

      socket.on("conversation_updated", (event) => {
        setConversations((prev) =>
          prev
            .map((conversation) =>
              conversation.id === event.conversationId
                ? {
                    ...conversation,
                    lastMessageText: event.lastMessageText || (event?.message?.attachments?.length ? "📎 Attachment" : ""),
                    lastMessageAt: event.lastMessageAt,
                    lastMessageAdId: event.lastMessageAdId || conversation.lastMessageAdId,
                    lastMessageAdTitle: event.lastMessageAdTitle || conversation.lastMessageAdTitle,
                    ad: conversation.ad
                      ? {
                          ...conversation.ad,
                          id: event.lastMessageAdId || conversation.ad.id,
                          title: event.lastMessageAdTitle || conversation.ad.title,
                        }
                      : conversation.ad,
                  }
                : conversation
            )
            .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
        );

        if (event.conversationId === selectedConversationIdRef.current && event.message) {
          setMessages((prev) => {
            const exists = prev.some((item) => item.id === event.message.id);
            if (exists) return prev;
            return [...prev, event.message];
          });
        }
      });

      socket.on("typing_state", (event) => {
        if (!event?.conversationId || !event?.userId) return;
        setTypingMap((prev) => {
          const existing = prev[event.conversationId] || {};
          return {
            ...prev,
            [event.conversationId]: {
              ...existing,
              [event.userId]: Boolean(event.isTyping),
            },
          };
        });
      });

      socket.on("presence_state", (event) => {
        if (!event?.userId) return;
        setPresenceMap((prev) => ({
          ...prev,
          [event.userId]: {
            online: Boolean(event.online),
            lastSeenAt: event.lastSeenAt || null,
          },
        }));
      });

      socket.on("messages_read", (event) => {
        if (!event?.conversationId || !Array.isArray(event?.messageIds) || !event?.readerId) return;
        if (event.conversationId !== selectedConversationIdRef.current) return;

        const readSet = new Set(event.messageIds.map(String));
        setMessages((prev) =>
          prev.map((message) => {
            if (!readSet.has(String(message.id))) return message;
            const readBy = Array.isArray(message.readBy) ? [...message.readBy] : [];
            if (!readBy.includes(event.readerId)) {
              readBy.push(event.readerId);
            }
            return {
              ...message,
              readBy,
            };
          })
        );
      });

      socketRef.current = socket;
    };

    setupSocket();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || typeof window === "undefined") return;

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    let mounted = true;

    const setupCallSocket = async () => {
      const { io } = await import("socket.io-client");
      if (!mounted) return;

      const socket = io(`${SOCKET_BASE_URL}/calls`, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 20,
        reconnectionDelay: 1000,
        auth: {
          token,
        },
      });

      socket.on("connect", () => {
        const current = callUiRef.current;
        clearCallRecoveryTimeout();
        if (!["calling", "connecting", "in-call"].includes(current.status)) {
          setIsCallRecovering(false);
          setCallError("");
          return;
        }

        setIsCallRecovering(true);
        setCallError("Call reconnected. Syncing media...");
        attemptCallRecovery(socket);

        if (
          pendingAutoCallRef.current &&
          selectedConversationIdRef.current &&
          callUiRef.current.status === 'idle'
        ) {
          pendingAutoCallRef.current = false;
          handleStartCall();
        }
      });

      socket.on("disconnect", () => {
        const current = callUiRef.current;
        if (!["calling", "connecting", "in-call", "incoming"].includes(current.status)) return;
        setIsCallRecovering(true);
        setCallError("Network issue detected. Reconnecting call...");
        scheduleCallRecoveryTimeout();
      });

      socket.on("connect_error", () => {
        setIsCallRecovering(true);
        setCallError("Call connection failed. Please check your network.");
      });

      socket.on("call_error", (event) => {
        setCallError(event?.message || "Call error occurred.");
      });

      socket.on("incoming_call", (event) => {
        const current = callUiRef.current;
        if (["calling", "incoming", "connecting", "in-call"].includes(current.status)) {
          socket.emit("call_reject", { callId: event.callId });
          return;
        }

        const callerName = getUserNameById(event.callerId);
        setIncomingCall({ ...event, callerName });
        setCallUi({
          status: "incoming",
          callId: event.callId,
          direction: "incoming",
          peerUserId: event.callerId,
          peerName: callerName,
          conversationId: event.conversationId,
        });
        setCallError("");
        startRingtone("incoming");
        showIncomingCallNotification({ callerName, callId: event.callId });
      });

      socket.on("call_ringing", (event) => {
        startRingtone("outgoing");
        setCallUi((prev) => {
          if (prev.status !== "calling") return prev;
          return {
            ...prev,
            callId: prev.callId || event.callId,
          };
        });
      });

      socket.on("call_busy", () => {
        playEndedTone();
        const current = callUiRef.current;
        const busyCallId = current.callId || `busy-${Date.now()}`;
        appendCallEventToMessages({
          conversationId: current.conversationId,
          callId: busyCallId,
          status: "missed",
          durationSec: 0,
          callerId: userIdRef.current,
        });
        updateConversationFromCallEvent({
          conversationId: current.conversationId,
          status: "missed",
          durationSec: 0,
          callerId: userIdRef.current,
        });
        resetCallUi({ error: "User is currently on another call." });
      });

      socket.on("call_rejected", (event) => {
        if (event?.callId && event.callId !== callUiRef.current.callId) return;
        playEndedTone();
        const current = callUiRef.current;
        appendCallEventToMessages({
          conversationId: current.conversationId,
          callId: event.callId,
          status: "rejected",
          durationSec: 0,
          callerId: userIdRef.current,
        });
        updateConversationFromCallEvent({
          conversationId: current.conversationId,
          status: "rejected",
          durationSec: 0,
          callerId: userIdRef.current,
        });
        resetCallUi({ error: "Call was declined." });
      });

      socket.on("call_ended", (event) => {
        if (event?.callId && event.callId !== callUiRef.current.callId) return;
        playEndedTone();
        const current = callUiRef.current;
        const finalStatus = event?.reason === "timeout" ? "missed" : "ended";
        appendCallEventToMessages({
          conversationId: current.conversationId,
          callId: event.callId,
          status: finalStatus,
          durationSec: event?.durationSec || 0,
          callerId: event?.by,
        });
        updateConversationFromCallEvent({
          conversationId: current.conversationId,
          status: finalStatus,
          durationSec: event?.durationSec || 0,
          callerId: event?.by,
        });
        if (event?.reason === 'timeout') {
          resetCallUi({ error: `${current.peerName || 'User'} did not pick the call.` });
          return;
        }
        resetCallUi({ error: "Call ended." });
      });

      socket.on("call_accepted", async (event) => {
        const current = callUiRef.current;
        if (!current.callId || current.callId !== event.callId) return;

        setCallUi((prev) => ({ ...prev, status: "connecting" }));
        setIsCallRecovering(false);
        clearCallRecoveryTimeout();
        playConnectedTone();

        const isCaller =
          current.direction === "outgoing" && String(event.by) !== String(userIdRef.current);
        if (!isCaller) return;

        try {
          const peerConnection = await createPeerConnection({
            callId: current.callId,
            targetUserId: current.peerUserId,
          });
          const offer = await peerConnection.createOffer({ offerToReceiveAudio: true });
          await peerConnection.setLocalDescription(offer);
          socket.emit("webrtc_offer", {
            callId: current.callId,
            targetUserId: current.peerUserId,
            signal: offer,
          });
        } catch {
          socket.emit("call_end", {
            callId: current.callId,
            reason: "webrtc_offer_failed",
          });
          resetCallUi({ error: "Could not establish call." });
        }
      });

      socket.on("webrtc_offer", async (event) => {
        const current = callUiRef.current;
        if (!current.callId || current.callId !== event.callId) return;

        try {
          const peerConnection = await createPeerConnection({
            callId: current.callId,
            targetUserId: event.fromUserId,
          });
          await peerConnection.setRemoteDescription(new RTCSessionDescription(event.signal));
          await flushPendingIceCandidates(peerConnection);

          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);

          socket.emit("webrtc_answer", {
            callId: current.callId,
            targetUserId: event.fromUserId,
            signal: answer,
          });

          setCallUi((prev) => ({ ...prev, status: "in-call" }));
          setIsCallRecovering(false);
          clearCallRecoveryTimeout();
          closeIncomingNotification();
          playConnectedTone();
        } catch {
          socket.emit("call_end", {
            callId: current.callId,
            reason: "webrtc_answer_failed",
          });
          resetCallUi({ error: "Could not establish call." });
        }
      });

      socket.on("webrtc_answer", async (event) => {
        const current = callUiRef.current;
        if (!current.callId || current.callId !== event.callId || !peerConnectionRef.current) return;

        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(event.signal));
          await flushPendingIceCandidates(peerConnectionRef.current);
          setCallUi((prev) => ({ ...prev, status: "in-call" }));
          setIsCallRecovering(false);
          clearCallRecoveryTimeout();
          playConnectedTone();
        } catch {
          socket.emit("call_end", {
            callId: current.callId,
            reason: "webrtc_remote_description_failed",
          });
          resetCallUi({ error: "Call setup failed." });
        }
      });

      socket.on("webrtc_ice_candidate", async (event) => {
        const current = callUiRef.current;
        if (!current.callId || current.callId !== event.callId || !event.signal) return;

        const candidate = new RTCIceCandidate(event.signal);
        if (!peerConnectionRef.current || !peerConnectionRef.current.remoteDescription) {
          pendingIceCandidatesRef.current.push(candidate);
          return;
        }

        try {
          await peerConnectionRef.current.addIceCandidate(candidate);
        } catch {
          // Ignore transient ICE candidate failures
        }
      });

      callSocketRef.current = socket;
    };

    setupCallSocket();

    return () => {
      mounted = false;
      if (callSocketRef.current) {
        callSocketRef.current.disconnect();
        callSocketRef.current = null;
      }
      clearCallRecoveryTimeout();
      closeIncomingNotification();
      clearCallResources();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    if (!socketRef.current || !selectedConversationId) return;
    if (socketRef.current.connected) {
      socketRef.current.emit("join_conversation", { conversationId: selectedConversationId });
    }
    return () => {
      socketRef.current?.emit("leave_conversation", { conversationId: selectedConversationId });
    };
  }, [selectedConversationId]);

  useEffect(() => {
    if (!socketRef.current || !selectedConversationId || messages.length === 0) return;
    socketRef.current.emit("mark_read", { conversationId: selectedConversationId });
  }, [messages, selectedConversationId]);

  useEffect(() => {
    return () => {
      if (typingStopTimeoutRef.current) {
        clearTimeout(typingStopTimeoutRef.current);
      }
      stopRingtone();
      clearCallRecoveryTimeout();
      closeIncomingNotification();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {
          // Ignore close errors during unmount
        });
        audioContextRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!remoteAudioRef.current) return;
    if (!remoteStream) {
      remoteAudioRef.current.srcObject = null;
      return;
    }

    remoteAudioRef.current.srcObject = remoteStream;
    remoteAudioRef.current.play().catch(() => {
      // Browser may block autoplay until user interacts again
    });
  }, [remoteStream]);

  useEffect(() => {
    if (callUi.status !== "in-call") return;
    const timer = setInterval(() => {
      setCallDurationSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [callUi.status]);

  const handleSendMessage = async ({ text, files = [] }) => {
    if (!selectedConversationId) return;
    const trimmedText = (text || "").trim();
    if (!trimmedText && (!files || files.length === 0)) return;

    setSending(true);
    setPageError("");
    try {
      const adContextId =
        selectedConversation?.ad?.id || selectedConversation?.lastMessageAdId || selectedConversation?.adId;

      const attachments = files.length
        ? await Promise.all(files.map((file) => uploadChatAttachment(file)))
        : [];

      let message;

      if (socketRef.current?.connected) {
        try {
          message = await Promise.race([
            new Promise((resolve, reject) => {
              socketRef.current.emit(
                "send_message",
                {
                  conversationId: selectedConversationId,
                  text: trimmedText,
                  adId: adContextId,
                  attachments,
                },
                (ack) => {
                  if (!ack || ack.success === false) {
                    reject(new Error(ack?.message || "Failed to send message."));
                    return;
                  }
                  resolve(ack.data);
                }
              );
            }),
            new Promise((_, reject) => {
              setTimeout(() => reject(new Error("Socket ack timeout")), 2500);
            }),
          ]);
        } catch {
          const response = await sendConversationMessage(selectedConversationId, trimmedText, adContextId, attachments);
          message = response?.data;
        }
      } else {
        const response = await sendConversationMessage(selectedConversationId, trimmedText, adContextId, attachments);
        message = response?.data;
      }

      setMessages((prev) => {
        const exists = prev.some((item) => item.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });

      setConversations((prev) =>
        prev
          .map((conversation) =>
            conversation.id === selectedConversationId
              ? {
                  ...conversation,
                  lastMessageText: message.text || (message.attachments?.length ? "📎 Attachment" : ""),
                  lastMessageAt: message.createdAt,
                  lastMessageAdId: message.adId || conversation.lastMessageAdId,
                  lastMessageAdTitle: message.adTitle || conversation.lastMessageAdTitle,
                  ad: conversation.ad
                    ? {
                        ...conversation.ad,
                        id: message.adId || conversation.ad.id,
                        title: message.adTitle || conversation.ad.title,
                      }
                    : conversation.ad,
                }
              : conversation
          )
          .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
      );
    } catch (error) {
      setPageError(error?.data?.message || error.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    try {
      await deleteConversation(conversationId);

      setConversations((prev) => {
        const updated = prev.filter((conversation) => conversation.id !== conversationId);

        if (selectedConversationIdRef.current === conversationId) {
          setSelectedConversation(updated[0] || null);
          setMessages([]);
        }

        return updated;
      });
    } catch (error) {
      setPageError(error?.data?.message || error.message || "Failed to delete conversation.");
    }
  };

  const handleTyping = (isTyping) => {
    if (!selectedConversationId || !socketRef.current?.connected) return;
    if (isTyping) {
      socketRef.current.emit("typing_start", { conversationId: selectedConversationId });
      if (typingStopTimeoutRef.current) clearTimeout(typingStopTimeoutRef.current);
      typingStopTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit("typing_stop", { conversationId: selectedConversationId });
      }, 1300);
      return;
    }

    if (typingStopTimeoutRef.current) {
      clearTimeout(typingStopTimeoutRef.current);
      typingStopTimeoutRef.current = null;
    }
    socketRef.current.emit("typing_stop", { conversationId: selectedConversationId });
  };

  const handleStartCall = async () => {
    if (!selectedConversationId || !selectedConversation?.otherUser?.id) return;
    if (!callSocketRef.current?.connected) {
      setCallError("Call service is reconnecting. Please try again.");
      return;
    }

    const peerUserId = selectedConversation.otherUser.id;
    const peerName = selectedConversation.otherUser.name || "User";

    requestNotificationAccess().catch(() => {
      // Notification access is optional for calling
    });

    setCallError("");
    setCallUi({
      status: "calling",
      callId: null,
      direction: "outgoing",
      peerUserId,
      peerName,
      conversationId: selectedConversationId,
    });

    try {
      const ack = await emitWithAck(callSocketRef.current, "call_invite", {
        conversationId: selectedConversationId,
        calleeId: peerUserId,
        type: "audio",
      });

      if (ack?.busy) {
        resetCallUi({ error: "User is currently on another call." });
        return;
      }

      setCallUi((prev) => ({
        ...prev,
        status: "calling",
        callId: ack?.callId || prev.callId,
      }));
    } catch {
      resetCallUi({ error: "Could not start call." });
    }
  };

  const handleAcceptCall = async () => {
    if (!incomingCall?.callId || !callSocketRef.current?.connected) return;

    try {
      stopRingtone();
      closeIncomingNotification();
      await ensureLocalStream();
      await emitWithAck(callSocketRef.current, "call_accept", {
        callId: incomingCall.callId,
      });
      setIncomingCall(null);
      setCallUi((prev) => ({ ...prev, status: "connecting" }));
      setCallError("");
    } catch {
      resetCallUi({ error: "Could not accept call." });
    }
  };

  const handleRejectCall = async () => {
    if (!incomingCall?.callId || !callSocketRef.current?.connected) {
      resetCallUi();
      return;
    }

    try {
      stopRingtone();
      closeIncomingNotification();
      await emitWithAck(callSocketRef.current, "call_reject", {
        callId: incomingCall.callId,
      });
      resetCallUi();
    } catch {
      resetCallUi({ error: "Could not reject call." });
    }
  };

  const handleEndCall = async () => {
    const activeCallId = callUiRef.current.callId;
    if (!activeCallId) {
      resetCallUi();
      return;
    }

    if (callSocketRef.current?.connected) {
      callSocketRef.current.emit("call_end", {
        callId: activeCallId,
        reason: "hangup",
      });
    }

    playEndedTone();

    resetCallUi();
  };

  const handleToggleMute = () => {
    if (!localStreamRef.current) return;
    const nextMuted = !isMuted;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsMuted(nextMuted);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthorized) {
    return null;
  }

  const otherUserId = selectedConversation?.otherUser?.id;
  const selectedPresence = otherUserId ? presenceMap[otherUserId] : null;
  const isOtherUserTyping = Boolean(
    selectedConversationId &&
      otherUserId &&
      typingMap[selectedConversationId] &&
      typingMap[selectedConversationId][otherUserId]
  );

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">

      {/* NAVBAR */}
      <Navbar />

      {/* CHAT SECTION */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* SIDEBAR */}
        <aside className="w-[360px] bg-white border-r border-gray-200 flex flex-col h-full min-h-0 overflow-hidden">
          <ChatSidebar
            conversations={conversations}
            selectedId={selectedConversationId}
            onSelectConversation={setSelectedConversation}
            onDeleteConversation={handleDeleteConversation}
            loading={loadingConversations}
          />
        </aside>

        {/* CHAT WINDOW */}
        <main className="flex-1 flex flex-col bg-[#F8F6F2] h-full min-h-0 overflow-hidden">
          {pageError && (
            <div className="mx-8 mt-4 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-lg px-4 py-2">
              {pageError}
            </div>
          )}
          {callError && (
            <div className="mx-8 mt-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold rounded-lg px-4 py-2">
              {callError}
            </div>
          )}

          <ChatWindow
            conversation={selectedConversation}
            messages={messages}
            currentUserId={user?.id}
            loading={loadingMessages}
            sending={sending}
            presence={selectedPresence}
            isOtherUserTyping={isOtherUserTyping}
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            onStartCall={handleStartCall}
            callState={callUi.status}
          />

          <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
        </main>

      </div>

      {(incomingCall || callUi.status !== "idle") && (
        <div className="fixed right-4 bottom-4 z-40 w-[min(360px,calc(100vw-2rem))] rounded-2xl bg-white border border-gray-200 shadow-2xl p-4">
          {incomingCall ? (
            <>
              <p className="text-sm font-semibold text-gray-900">Incoming call</p>
              <p className="text-xs text-gray-600 mt-1">{incomingCall.callerName} is calling you</p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRejectCall}
                  className="flex-1 px-3 py-2 rounded-full bg-white border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={handleAcceptCall}
                  className="flex-1 px-3 py-2 rounded-full bg-[#157A4F] text-white text-xs font-semibold hover:bg-[#11663f]"
                >
                  Accept
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-gray-900">
                {callUi.status === "calling" && `Calling ${callUi.peerName}...`}
                {callUi.status === "connecting" && `Connecting with ${callUi.peerName}...`}
                {callUi.status === "in-call" && `On call with ${callUi.peerName}`}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {isCallRecovering
                  ? "Network fluctuation detected. Restoring call..."
                  : callUi.status === "in-call"
                  ? `Duration ${formatCallDuration(callDurationSec)}`
                  : "Keep this panel open while you continue chatting"}
              </p>
              <div className="mt-3 flex items-center gap-2">
                {callUi.status === "in-call" && (
                  <button
                    type="button"
                    onClick={handleToggleMute}
                    className="px-3 py-2 rounded-full border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    {isMuted ? "Unmute" : "Mute"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleEndCall}
                  className="ml-auto px-3 py-2 rounded-full bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
                >
                  End Call
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}