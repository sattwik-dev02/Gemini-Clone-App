import { Menu, Plus, Search, MessageSquare, Trash2, Sparkles } from "lucide-react";
import { useState } from "react";
import DeleteModal from "./DeleteModal";

export default function Sidebar({ chats, activeChatId, onNewChat, onSelectChat, onDeleteChat, isOpen, setIsOpen }) {
    const [deleteModal, setDeleteModal] = useState(false);
    const [chatToDel, setChatToDel] = useState(null);

    const [searchQuery, setSearchQuery] = useState("");

    // Filered chats for search or normal display
    const filteredChats = chats.filter((chat) => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;

        const titleMatch = chat.title
            ?.toLowerCase()
            .includes(query);
        const messageMatch = chat.messages?.some((message) =>
            message.text?.toLowerCase().includes(query)
        );

        return titleMatch || messageMatch;
    });

    function formatTimestamp(date) {
        if (!date) return "";
        const parsedDate = new Date(date);
        if (Number.isNaN(parsedDate.getTime())) {
            return "";
        }

        return parsedDate.toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function handleDeleteChat(id) {
        setDeleteModal(true);
        setChatToDel(id);
    }

    return (
        <aside
            className={`${isOpen ? "w-72" : "w-0"
                } shrink-0 overflow-hidden bg-[#1e1f20]
            transition-all duration-300`}
        >
            <div className="flex h-full w-72 flex-col p-4">
                <button
                    onClick={() => setIsOpen(false)}
                    aria-label="Close sidebar"
                    className="mb-8 w-fit rounded-lg p-2
                    text-gray-300 hover:bg-white/10"
                >
                    <Menu size={22} />
                </button>

                <button
                    onClick={onNewChat}
                    className="flex w-fit items-center gap-3
                    rounded-full bg-[#282a2c] px-5 py-3
                    text-sm text-gray-200 hover:bg-[#35373a]"
                >
                    <Plus size={20} />
                    New chat
                </button>

                <div className="mt-10 min-h-0 flex-1 overflow-y-auto">
                    <h3
                        className="mb-4 px-3 text-sm font-semibold
                        text-gray-400"
                    >
                        Recent
                    </h3>
                    <div className="relative mb-4">
                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search conversations..."
                            className="w-full rounded-xl
                            border border-white/10
                            bg-[#1e1f20] py-3 pl-10 pr-3
                            text-sm text-white outline-none
                            focus:border-blue-500"
                        />
                    </div>
                    {/* show filtered chats */}
                    {filteredChats.map((chat) => (
                        <div
                            key={chat.id}
                            onClick={() => onSelectChat(chat.id)}
                            className={`group flex items-start gap-3
                                    rounded-xl px-3 py-2 cursor-pointer
                                    ${activeChatId === chat.id
                                    ? "bg-[#333537]"
                                    : "hover:bg-[#282a2c]"
                                }`}
                        >
                            <MessageSquare size={16} className="mt-1 shrink-0 text-gray-400" />

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm">
                                    {chat.title}
                                </p>

                                <small className="text-xs text-gray-500">
                                    {formatTimestamp(chat.updatedAt || chat.createdAt)}
                                </small>
                            </div>
                            {/* Delete actions */}
                            <button
                                onClick={() => handleDeleteChat(chat.id)}
                                aria-label={`Delete ${chat.title}`}
                                className="mr-2 rounded-lg p-2
                                text-gray-400 hover:text-red-400"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    ))}

                    {filteredChats.length === 0 && (
                        <p className="px-3 text-sm text-gray-500">No conversations yet.</p>
                    )}
                </div>

                <div
                    className="flex items-center gap-3
                    border-t border-white/10 pt-4
                    text-sm text-gray-400"
                >
                    <Sparkles size={19} />
                    Gemini-inspired AI
                </div>
            </div>
            {deleteModal && <DeleteModal chatToDel={chatToDel} closeDelModal={setDeleteModal} onDeleteChat={onDeleteChat} />}
        </aside>
    );
}
