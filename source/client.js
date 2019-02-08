import { CookieStorage } from "cookie-storage"

const initCookie = function(cookies, namespace) {
    const hasSession = document.querySelector(`[data-${namespace}-session]`)

    if (!hasSession) {
        throw new Error("none of the frames have a session id")
    }

    const nextSession = hasSession.getAttribute(`data-${namespace}-session`)
    const previousSession = getSession(cookies, namespace)

    if (previousSession && previousSession !== nextSession) {
        throw new Error("sessions are not being reused")
    }

    setSession(cookies, namespace, nextSession)
}

const setSession = function(cookies, namespace, session) {
    cookies.setItem(`${namespace}-session`, session, {
        path: "/",
    })
}

const getSession = function(cookies, namespace) {
    return cookies.getItem(`${namespace}-session`)
}

class Client {
    constructor({ endpoint, namespace = "wiry", cookies = new CookieStorage() }) {
        this.endpoint = endpoint
        this.namespace = namespace
        this.cookies = cookies
    }

    attach() {
        const { namespace, cookies, onClick } = this

        initCookie(cookies, namespace)

        window.addEventListener("click", onClick)
    }

    onClick = async event => {
        const { endpoint, namespace, cookies } = this
        const { target } = event

        const session = getSession(cookies, namespace)
        const sessionEndpoint = `${endpoint}?${namespace}-session=${session}`

        if (target.hasAttribute(`data-${namespace}-click`)) {
            const parent = target.closest(`[data-${namespace}-id]`)

            const response = await fetch(sessionEndpoint, {
                method: "POST",
                body: JSON.stringify({
                    type: "click",
                    data: {
                        id: parent.getAttribute(`data-${namespace}-id`),
                        method: target.getAttribute(`data-${namespace}-click`),
                    },
                }),
            })

            const json = await response.json()

            if (json.type === "render") {
                parent.innerHTML = json.data.html
                parent.replaceWith(...parent.childNodes)
            }
        }
    }
}

export { Client }
