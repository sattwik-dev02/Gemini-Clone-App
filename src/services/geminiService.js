const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export async function sendMessage(messages) {
    const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.error || "Something went wrong."
        );
    }

    return data.reply;
}

// for stream message
export async function streamMessage(messages, onChunk, signal) {

    const response = await fetch(`${API_URL}/api/chat/stream`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ messages }),
            signal,
        }
    );
    console.log("Api response: ", response);

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(
            data.error || `HTTP error: ${response.status}`
        );
    }

    if (!response.body) {
        throw new Error("Streaming is not supported.");
    }

    // Create a reader to consume the streamed response
    const reader = response.body.getReader();

    // Convert binary chunks into readable text
    const decoder = new TextDecoder();

    try {
        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            const text = decoder.decode(value, {
                stream: true,
            });

            if (text) {
                const characters = Array.from(text);

                for (let i = 0; i < characters.length; i += 2) {
                    if (signal?.aborted) return;

                    const piece = characters.slice(i, i + 2).join("");

                    onChunk(piece);

                    // Delay before displaying the next piece
                    // await new Promise((resolve) => setTimeout(resolve, 10));
                }
            }
        }

        const remaining = decoder.decode();

        if (remaining) {
            onChunk(remaining);
        }

        if (signal?.aborted) {
            throw new DOMException(
                "Generation stopped",
                "AbortError"
            );
        }
    } finally {
        reader.releaseLock();
    }
}