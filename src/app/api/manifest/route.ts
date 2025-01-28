import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    const manifest = {
        name: "Osakedata",
        short_name: "Osakedata",
        description: "Suomalainen osakedata sovellus",
        id: "/home",
        start_url: "/home",
        scope: "/",
        display: "standalone",
        background_color: "#FFFFFF",
        theme_color: "#1a4b8c",
        orientation: "portrait-primary",
        lang: "fi",
        form_factor: "wide",
        form_factors: [
            {
                platform: "desktop",
                form_factor: "wide"
            },
            {
                platform: "mobile",
                form_factor: "wide"
            }
        ],
        icons: [
            {
                src: "/icons/icon-192x192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "any maskable"
            },
            {
                src: "/icons/icon-512x512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any maskable"
            }
        ]
    }
    return NextResponse.json(manifest)
}