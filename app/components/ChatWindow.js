"use client";

import { Check, CheckCheck, Paperclip, Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, Send, X, MoreVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import UserReportModal from "../components/UserReportModal";

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const getAvatarUrl = (avatar, name) => {
  if (avatar && String(avatar).trim()) return avatar;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=157A4F&color=ffffff&size=128`;
};

const formatLastSeen = (presence) => {
  if (!presence) return "Offline";
  if (presence.online) return "Online";
  if (!presence.lastSeenAt) return "Offline";
  const date = new Date(presence.lastSeenAt);
  if (Number.isNaN(date.getTime())) return "Offline";
  return `Last seen ${date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

export default function ChatWindow({
  conversation,
  messages = [],
  currentUserId,
  loading = false,
  sending = false,
  presence,
  isOtherUserTyping = false,
  onSendMessage,
  onTyping,
  onStartCall,
  callState = "idle",
}) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const message = text.trim();
    if ((!message && attachments.length === 0) || !conversation || sending) return;
    onSendMessage?.({ text: message, files: attachments });
    setText("");
    setAttachments([]);
    onTyping?.(false);
  };

  const onKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const onTextChange = (event) => {
    setText(event.target.value);
    onTyping?.(Boolean(event.target.value.trim()));
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;
    setAttachments((prev) => [...prev, ...selectedFiles].slice(0, 5));
    event.target.value = "";
  };

  const removeAttachment = (indexToRemove) => {
    setAttachments((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm px-6 text-center">
        Select a conversation or click Chat on an ad to start messaging.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#F8F6F2] overflow-hidden">

      {/* HEADER (Fixed) */}
      <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-200 shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <img
            src={getAvatarUrl(conversation?.otherUser?.avatar, conversation?.otherUser?.name)}
            width={45}
            height={45}
            alt={conversation?.otherUser?.name || "User"}
            className="rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-lg text-gray-800">
              {conversation?.otherUser?.name || "User"}
            </h3>
            <p className="text-xs text-gray-500 -mt-0.5">
              {isOtherUserTyping ? "Typing..." : formatLastSeen(presence)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 relative">
          <div className="text-xs text-gray-500 text-right">
            <p>{conversation?.ad?.title || "Ad conversation"}</p>
            {conversation?.ad?.price !== undefined && conversation?.ad?.price !== null && (
              <p className="font-semibold text-[#157A4F]">₹{Number(conversation.ad.price).toLocaleString("en-IN")}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="w-10 h-10 rounded-full bg-[#F8F6F2] text-[#157A4F] border border-gray-200 flex items-center justify-center hover:bg-[#ecf8f1] transition"
            title="More options"
          >
            <MoreVertical size={20} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-12 z-20 bg-white border border-gray-200 rounded-xl shadow-lg min-w-[120px] py-1 flex flex-col">
              <button
                className="px-4 py-2 text-left hover:bg-gray-50 text-sm text-gray-800 flex items-center gap-2"
                onClick={() => {
                  setMenuOpen(false);
                  if (conversation?.otherUser?.id || conversation?.otherUser?._id) onStartCall?.();
                }}
                disabled={callState !== "idle" || !(conversation?.otherUser?.id || conversation?.otherUser?._id)}
              >
                <Phone size={16} /> Call
              </button>
              <button
                className="px-4 py-2 text-left hover:bg-gray-50 text-sm text-gray-800 flex items-center gap-2"
                onClick={() => {
                  setMenuOpen(false);
                  if (conversation?.otherUser?.id || conversation?.otherUser?._id) setShowReportModal(true);
                }}
                disabled={!(conversation?.otherUser?.id || conversation?.otherUser?._id)}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" /> Report
              </button>
            </div>
          )}
        </div>
            <UserReportModal
              isOpen={showReportModal}
              onClose={() => setShowReportModal(false)}
              userId={conversation?.otherUser?.id || conversation?.otherUser?._id || ""}
              userName={conversation?.otherUser?.name}
            />
      </div>

      {/* SCROLLABLE MESSAGES AREA */}
      <div className="flex-1 min-h-0 overflow-y-auto px-10 py-8 space-y-6">

        {loading && (
          <div className="text-sm text-gray-500">Loading messages...</div>
        )}

        {!loading && messages.length === 0 && (
          <div className="text-sm text-gray-500">No messages yet. Say hi 👋</div>
        )}

        {messages.map((message, index) => {
          if (message?.__kind === "call_event") {
            const callEvent = message.callEvent || {};
            const isMissed = callEvent.status === "missed";
            const isOutgoing = Boolean(callEvent.isOutgoing);
            const Icon = isMissed ? PhoneMissed : isOutgoing ? PhoneOutgoing : PhoneIncoming;
            const iconColor = isMissed ? "text-red-500" : "text-[#157A4F]";
            return (
              <div key={message.id} className="flex justify-center">
                <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs text-gray-700 shadow-sm min-w-[210px]">
                  <div className="flex items-center justify-center gap-2 font-semibold">
                    <Icon size={14} className={iconColor} />
                    <span>{callEvent.label || "Call update"}</span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1 text-center">{formatTime(message.createdAt)}</div>
                </div>
              </div>
            );
          }

          const isMine = String(message.senderId) === String(currentUserId);
          const previousMessage = index > 0 ? messages[index - 1] : null;
          const isNewAdContext = !previousMessage || previousMessage.adId !== message.adId;
          return (
            <div key={message.id} className="space-y-2">
              {isNewAdContext && (
                <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3 shadow-sm max-w-md">
                  {message.adImage ? (
                    <img
                      src={message.adImage}
                      alt={message.adTitle || "Ad"}
                      className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-xs text-gray-500">
                      Ad
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Chat about this ad</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{message.adTitle || "Ad context"}</p>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                      {message.adPrice !== undefined && message.adPrice !== null && (
                        <span className="font-semibold text-[#157A4F]">₹{Number(message.adPrice).toLocaleString("en-IN")}</span>
                      )}
                      {message.adLocation && <span className="truncate">{message.adLocation}</span>}
                    </div>
                  </div>
                </div>
              )}

              <div
                className={`${
                  isMine
                    ? "bg-[#157A4F] text-white ml-auto"
                    : "bg-white border border-gray-200 text-gray-800"
                } p-4 rounded-2xl w-fit max-w-md shadow-sm`}
              >
                {message.text ? <p className="whitespace-pre-wrap">{message.text}</p> : null}

                {Array.isArray(message.attachments) && message.attachments.length > 0 && (
                  <div className={`${message.text ? "mt-3" : ""} space-y-2`}>
                    {message.attachments.map((attachment, attachmentIndex) => {
                      const isImage = (attachment?.type === "image") || (attachment?.mimeType || "").startsWith("image/");
                      if (isImage) {
                        return (
                          <a
                            key={`${message.id}-attachment-${attachmentIndex}`}
                            href={attachment.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block"
                          >
                            <img
                              src={attachment.url}
                              alt={attachment.name || "attachment"}
                              className="rounded-xl border border-black/10 max-h-64 object-cover"
                            />
                          </a>
                        );
                      }

                      return (
                        <a
                          key={`${message.id}-attachment-${attachmentIndex}`}
                          href={attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs ${
                            isMine ? "bg-white/15" : "bg-gray-100"
                          }`}
                        >
                          <span className="truncate max-w-[220px]">📎 {attachment.name || "Attachment"}</span>
                          <span className="font-semibold">Open</span>
                        </a>
                      );
                    })}
                  </div>
                )}

                <div className={`text-xs mt-2 flex items-center gap-1 justify-end ${isMine ? "text-green-100" : "text-gray-400"}`}>
                  <span>{formatTime(message.createdAt)}</span>
                  {isMine && (
                    (Array.isArray(message.readBy) && message.readBy.some((id) => String(id) !== String(currentUserId))) ? (
                      <CheckCheck size={14} />
                    ) : (
                      <Check size={14} />
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />

      </div>

      {/* INPUT (Fixed) */}
      <div className="px-8 py-4 bg-white border-t border-gray-200 shrink-0 sticky bottom-0 z-10">
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div key={`${file.name}-${index}`} className="bg-[#F8F6F2] border border-gray-200 rounded-full pl-3 pr-2 py-1 text-xs text-gray-700 flex items-center gap-2">
                <span className="max-w-[180px] truncate">{file.name}</span>
                <button onClick={() => removeAttachment(index)} className="text-gray-500 hover:text-red-500">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4">
          <button
            onClick={handleAttachClick}
            className="text-gray-400 hover:text-[#F5B849] transition"
            type="button"
          >
            <Paperclip size={20} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          <input
            type="text"
            placeholder="Type your message..."
            value={text}
            onChange={onTextChange}
            onKeyDown={onKeyDown}
            className="flex-1 bg-[#F8F6F2] rounded-full px-6 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#157A4F]"
          />

          <button
            onClick={handleSend}
            disabled={sending || (!text.trim() && attachments.length === 0)}
            className="bg-[#F5B849] text-white p-3 rounded-full hover:bg-[#e0a837] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

    </div>
  );
}