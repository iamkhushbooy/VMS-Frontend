
export const refuelingErrorMessage = (err: any) => {
    let msg = '';

    if (typeof err?.response?.data === 'string' && (err.response.data.includes('<!DOCTYPE') || err.response.data.includes('<html'))) {
        return 'Server is currently unavailable. Please check your internet connection or try again later.';
    }

    if (err?.response?.data?._server_messages) {
        try {
            const messages = JSON.parse(err.response.data._server_messages);
            if (Array.isArray(messages)) {
                const parsedMessages = messages.map(m => JSON.parse(m));
                let errorMsgObj = parsedMessages.find(m => 
                    m.message && m.message.includes("Stock Entry creation failed.")
                );
                if (!errorMsgObj) {
                    errorMsgObj = parsedMessages.find(m => m.indicator === 'red' || m.raise_exception === 1);
                }

                if (errorMsgObj) {
                    msg = errorMsgObj.message;
                } else {
                    msg = parsedMessages[0].message;
                }
            }
        } catch (e) {
            console.error("Failed to parse server messages", e);
        }
    } 
    else if (err?.response?.data?.exception) {
        const exc = err.response.data.exception;
        msg = typeof exc === 'string' && exc.includes(':') 
            ? exc.split(':').slice(1).join(':').trim() 
            : exc;
    }

    if (!msg) {
        msg = err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.';
    }

    return msg.replace(/<[^>]*>/g, '').trim();
};






export const getErrorMessage = (err: any) => {
    let msg = '';
    if (typeof err?.response?.data === 'string' && (err.response.data.includes('<!DOCTYPE') || err.response.data.includes('<html'))) {
        return 'Server is currently unavailable. Please check your internet connection.';
    }
    if (err?.response?.data?._server_messages) {
        try {
            const messages = JSON.parse(err.response.data._server_messages);
            if (Array.isArray(messages)) {
                const parsedMessages = messages.map(m => {
                    try { return typeof m === 'string' ? JSON.parse(m) : m; }
                    catch(e) { return { message: m }; }
                });
                let errorMsgObj = parsedMessages.find(m => 
                    m.message && (
                        m.message.toLowerCase().includes("mandatory") || 
                        m.message.toLowerCase().includes("missing") ||
                        m.message.toLowerCase().includes("failed")
                    )
                );
                if (!errorMsgObj) {
                    errorMsgObj = parsedMessages.find(m => m.indicator === 'red' || m.raise_exception === 1);
                }
                if (errorMsgObj) {
                    msg = errorMsgObj.message;
                } else {
                    msg = parsedMessages[parsedMessages.length - 1].message;
                }
            }
        } catch (e) {
            console.error("Failed to parse server messages", e);
        }
    } 
    else if (err?.response?.data?.exception) {
        msg = err.response.data.exception;
    }
    if (!msg) {
        msg = err?.response?.data?.message || err?.message || 'Something went wrong.';
    }
    return msg.replace(/<[^>]*>/g, '').trim();
};