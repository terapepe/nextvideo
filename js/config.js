window.NEXTVIDEO_CONFIG = {
  brand: {
    name: "NextVideo",
    tagline: "Multi-model AI video generation",
    site: "https://nextvideo.top",
    email: "cre@nextvideo.top"
  },

  token: {
    name: "NextVideo",
    symbol: "NEXT",
    mode: "single",
    singleNetwork: "robinhood",
    multiOrder: ["solana", "robinhood", "base", "bsc"],

    evmAddress: "",
    solanaAddress: "",

    chains: {
      solana:    { ca: "", tagline: "Near-zero fees, instant settlement" },
      robinhood: { ca: "", tagline: "Fast, low-fee L2 built for trading" },
      base:      { ca: "", tagline: "Onchain with the Base community" },
      bsc:       { ca: "", tagline: "High-throughput payments on BNB Chain" }
    }
  },

  socials: {
    x: "NextVideo",        // handle without @  → https://x.com/NextVideo
    telegram: "NextVideo"  // handle or group   → https://t.me/NextVideo
  },

  api: {
    baseUrl: ""
  },

  pricing: {},

  defaultModel: "dreamina-seedance-2-0-mini-260615",
  providers: {
    "alibaba": {
      "name": "Alibaba",
      "tagline": "Wan video models",
      "color": "#FF6A00"
    },
    "byteplus": {
      "name": "BytePlus",
      "tagline": "Seedance video models by ByteDance",
      "color": "#3370FF"
    },
    "minimax": {
      "name": "MiniMax",
      "tagline": "MiniMax H3 and Hailuo",
      "color": "#E2457A"
    },
    "vidu": {
      "name": "Vidu",
      "tagline": "Vidu models by Shengshu Technology",
      "color": "#7C5CFF"
    },
    "kling": {
      "name": "Kling",
      "tagline": "Kling models by Kuaishou",
      "color": "#22C55E"
    }
  },

  models: [
    {
      "id": "wan3.0-video",
      "name": "Wan 3.0",
      "provider": "alibaba",
      "types": [
        "Text to Video",
        "Image to Video",
        "Video to Video"
      ],
      "description": "All-in-one Wan model for text-to-video, image-to-video (first / first-last frame), and reference-to-video with native audio. Up to 30 seconds at 480p–1080p — a solid default for product demos, talking-head clips, and everyday videos.",
      "durations": [
        2,
        30
      ],
      "resolutions": [
        "480p",
        "720p",
        "1080p"
      ],
      "ratios": [
        "16:9",
        "9:16",
        "1:1",
        "4:3",
        "3:4",
        "adaptive"
      ]
    },
    {
      "id": "wan3.0-video-prime",
      "name": "Wan 3.0 Prime",
      "provider": "alibaba",
      "types": [
        "Text to Video",
        "Image to Video",
        "Video to Video"
      ],
      "description": "Same capabilities as Wan 3.0 (text / image / reference, up to 30s, 480p–1080p, native audio), tuned for significantly faster end-to-end generation when you want quicker turnaround.",
      "durations": [
        2,
        30
      ],
      "resolutions": [
        "480p",
        "720p",
        "1080p"
      ],
      "ratios": [
        "16:9",
        "9:16",
        "1:1",
        "4:3",
        "3:4",
        "adaptive"
      ]
    },
    {
      "id": "dreamina-seedance-2-0-260128",
      "name": "Seedance 2.0",
      "provider": "byteplus",
      "types": [
        "Text to Video",
        "Image to Video",
        "Video to Video"
      ],
      "description": "Seedance 2.0 is the full-quality model for text-to-video, image-to-video, and multimodal reference, with native audio. Clips are 4–15 seconds at 480p, 720p, 1080p, or 4K.",
      "durations": [
        4,
        15
      ],
      "resolutions": [
        "480p",
        "720p",
        "1080p",
        "4k"
      ],
      "ratios": [
        "16:9",
        "9:16",
        "1:1",
        "4:3",
        "3:4",
        "21:9",
        "adaptive"
      ]
    },
    {
      "id": "dreamina-seedance-2-0-fast-260128",
      "name": "Seedance 2.0 Fast",
      "provider": "byteplus",
      "types": [
        "Text to Video",
        "Image to Video",
        "Video to Video"
      ],
      "description": "Seedance 2.0 Fast prioritizes speed for drafts and previews: text-to-video, image-to-video, and multimodal reference, with native audio. Clips are 4–15 seconds and top out at 720p (no 1080p).",
      "durations": [
        4,
        15
      ],
      "resolutions": [
        "480p",
        "720p"
      ],
      "ratios": [
        "16:9",
        "9:16",
        "1:1",
        "4:3",
        "3:4",
        "21:9",
        "adaptive"
      ]
    },
    {
      "id": "dreamina-seedance-2-0-mini-260615",
      "name": "Seedance 2.0 Mini",
      "provider": "byteplus",
      "types": [
        "Text to Video",
        "Image to Video",
        "Video to Video"
      ],
      "description": "Seedance 2.0 Mini prioritizes lower cost and faster turnaround for high-volume clips: text-to-video, image-to-video, and multimodal reference, with native audio. Clips are 4–15 seconds and top out at 720p (no 1080p).",
      "durations": [
        4,
        15
      ],
      "resolutions": [
        "480p",
        "720p"
      ],
      "ratios": [
        "16:9",
        "9:16",
        "1:1",
        "4:3",
        "3:4",
        "21:9",
        "adaptive"
      ]
    },
    {
      "id": "dreamina-seedance-2-5-260628",
      "name": "Seedance 2.5",
      "provider": "byteplus",
      "types": [
        "Text to Video",
        "Image to Video",
        "Video to Video"
      ],
      "description": "Seedance 2.5 targets longer storytelling with native audio sync, up to 30 seconds and 480p–1080p. Supports text-to-video, image-to-video, and multimodal references for scene and character consistency.",
      "durations": [
        4,
        30
      ],
      "resolutions": [
        "480p",
        "720p",
        "1080p"
      ],
      "ratios": [
        "16:9",
        "9:16",
        "1:1",
        "4:3",
        "3:4",
        "21:9",
        "adaptive"
      ]
    },
    {
      "id": "MiniMax-H3",
      "name": "MiniMax H3",
      "provider": "minimax",
      "types": [
        "Text to Video"
      ],
      "description": "MiniMax H3 generates 4–15 second clips at 768p or 2K with text-to-video (Studio). Multimodal reference and image conditioning are available on the API; this build focuses on text-to-video.",
      "durations": [
        4,
        15
      ],
      "resolutions": [
        "768p",
        "2k"
      ],
      "ratios": [
        "21:9",
        "16:9",
        "4:3",
        "1:1",
        "3:4",
        "9:16"
      ]
    },
    {
      "id": "MiniMax-Hailuo-2.3",
      "name": "Hailuo 2.3",
      "provider": "minimax",
      "types": [
        "Text to Video"
      ],
      "description": "Hailuo 2.3 text-to-video at 768p or 1080p with fixed 6 or 10 second clips (1080p is 6 seconds only). Priced per clip on PowerTokens.",
      "durations": [
        6,
        10
      ],
      "resolutions": [
        "768p",
        "1080p"
      ],
      "ratios": [
        "16:9"
      ]
    },
    {
      "id": "viduq4-preview",
      "name": "Vidu Q4 Preview",
      "provider": "vidu",
      "types": [
        "Text to Video",
        "Image to Video"
      ],
      "description": "Vidu Q4 Preview (I2V / reference-to-video only — no text-only). Clips 3–16 seconds at 540p–4K with optional native audio. Attach a first frame or reference images to generate.",
      "durations": [
        3,
        16
      ],
      "resolutions": [
        "540p",
        "720p",
        "1080p",
        "2k",
        "4k"
      ],
      "ratios": [
        "16:9",
        "9:16",
        "1:1",
        "3:4",
        "4:3"
      ]
    },
    {
      "id": "kling-v3",
      "name": "kling v3",
      "provider": "kling",
      "types": [
        "Text to Video",
        "Image to Video"
      ],
      "description": "kling v3 offers text-to-video and image-to-video (first / last frame) with optional native audio. Duration 3–15 seconds; choose 720p, 1080p, or 4K mode when you need higher output resolution.",
      "durations": [
        3,
        15
      ],
      "resolutions": [
        "720p",
        "1080p",
        "4k"
      ],
      "ratios": [
        "16:9",
        "9:16",
        "1:1"
      ]
    }
  ],

  presets: [
    {
      "id": "shopping",
      "label": "Pet daily",
      "blurb": "Puppy grocery run · vertical · ~5s · 720p",
      "prompt": "Subject: a six-month-old golden retriever puppy with thick fluffy fur, wearing a plain blue apron with no lettering, front paws on a mini plastic children's shopping cart.\nScene: a bright American warehouse-supermarket aisle in daytime. A glass freezer on the right is packed with solid yellow cheese blocks; the door is frosted. Shelves behind are soft and out of focus. No faces, no brand marks.\nAction and motion: the puppy pushes the cart forward two steps, then plants all four paws and stops at the freezer. It presses its wet nose to the glass and sniffs hard, and a clear strand of drool stretches off its chin. Ears flatten, and one paw reaches for the door handle but stops before opening it.\nCamera: vertical frame, lens at the puppy's eye line, a smooth follow that halts with the puppy and settles into a close-up of the drooling face.\nStyle and constraints: photoreal, even overhead fluorescent light with a warm highlight on the cheese. Fur, frosted glass, matte plastic, and wet drool stay distinct. Audio is cart wheels and distant store-announcement noise only. No on-screen text, watermark, logo, or extra people.",
      "video": "assets/presets/product.mp4",
      "poster": "assets/presets/product-poster.webp",
      "duration": 5,
      "ratio": "9:16",
      "resolution": "720p"
    },
    {
      "id": "canyon",
      "label": "Fantasy scene",
      "blurb": "Backyard built inside a canyon · ~5s · 720p · vertical",
      "prompt": "Subject: a narrow canyon of tall red rock, with a small finished backyard on the canyon floor: a raised timber deck, a slim pergola, a plunge pool, a stone fire pit, and one worker in work clothes.\nScene: sunset. The rock faces are warm orange and the pool reflects them. The timber is new. No crowd.\nAction and motion: three jump cuts in this same canyon, nowhere else. First, two workers carry timber in between the walls. Next, the deck, pergola, pool, and fire pit are already standing and water is running into the pool. Last, the worker sits at the pool edge, the pit has a small flame, and the rocks glow.\nCamera: vertical and stabilized. Start high on the rock wall, step closer to the floor with each cut, and end on a medium shot of the seated worker and the water.\nStyle and constraints: photoreal cinematic, natural sunset, real wood and stone. Sound is canyon wind, a soft timber knock, water, and the fire. No narration, no music, no on-screen text, no watermark, no logo.",
      "video": "assets/presets/cinematic.mp4",
      "poster": "assets/presets/cinematic-poster.webp",
      "duration": 5,
      "ratio": "9:16",
      "resolution": "720p"
    },
    {
      "id": "seal",
      "label": "Fun short",
      "blurb": "Seal crashes a seaside wedding · ~5s · 720p · vertical",
      "prompt": "Subject: a real-proportioned seal with wet dark fur, already between the white folding chairs of a beach wedding's front row. The couple is kissing farther back. Guests in summer clothes sit on either side.\nScene: daytime sand, white chairs, a few simple flowers, sea wind. The image looks like a late-1990s home DV tape: CCD noise, slightly blown highlights, auto white-balance drift, obvious handheld shake, and a brief focus hunt. Not a commercial, not a cartoon.\nAction and motion: the seal is the first thing in frame. It shuffles forward, guests turn their heads, and as the couple kisses the seal claps both front flippers against its chest. Hold on the clapping and the nearest guest's reaction. No fade out.\nCamera: vertical handheld, starting close on the seal, then widening just enough to catch the kiss and the clapping together.\nStyle and constraints: an unplanned moment. Weight, contact, shadows, and clothing stay believable. Sound is wind, chair creaks, a short guest gasp, and the flipper claps. No music, no narration, no on-screen text, no watermark, no logo.",
      "video": "assets/presets/fantasy.mp4",
      "poster": "assets/presets/fantasy-poster.webp",
      "duration": 5,
      "ratio": "9:16",
      "resolution": "720p"
    },
    {
      "id": "locker",
      "label": "Drama dialogue",
      "blurb": "Locker-room corridor dialogue, English lip-sync · ~5s · 720p",
      "prompt": "Subject: a woman in her early twenties in a casual jacket and full-length pants, arms loosely crossed; a man the same age in a dark hoodie and sweatpants, damp hair, a towel over one shoulder. Both photoreal, natural skin, no beauty filter.\nScene: daytime corridor of a public athletic center, just outside the locker rooms. Cool fluorescent light, painted concrete, metal lockers blurred behind them, a wooden bench, scuffed floor. Dry air. No steam, no shower, no bathroom fixtures.\nAction and motion: she is already waiting. He comes in from the locker-room door and stops a polite distance away, jaw tight, eyes flicking off and back. She asks, lip-synced, in English: \"Who's in the bet. Names.\" He does not answer yet. End on that held look. No kiss.\nCamera: eye-level medium two-shot, subtle handheld, shallow depth of field, screen direction kept.\nStyle and constraints: photoreal youth drama. Audio is the one line, hallway tone, a distant gym thud, and footsteps. No music, no on-screen text, no watermark, no logo.",
      "video": "assets/presets/drama.mp4",
      "poster": "assets/presets/drama-poster.webp",
      "duration": 5,
      "ratio": "9:16",
      "resolution": "720p"
    }
  ]
};
