const Stage4 = document.getElementById("Stage4");
const Stage4Slides = Array.from(document.querySelectorAll(".Stage4Slide"));
const DaysCount = document.getElementById("DaysCount");
const MinutesCount = document.getElementById("MinutesCount");
const SecondsCount = document.getElementById("SecondsCount");
const MorningThoughtsCount = document.getElementById("MorningThoughtsCount");
const NightThoughtsCount = document.getElementById("NightThoughtsCount");
const RomanticAudio = document.getElementById("RomanticAudio");
const TrackAudio = document.getElementById("TrackAudio");
const TrackButtons = Array.from(document.querySelectorAll(".Stage4TrackButton"));
const Stage4Tracks = document.querySelector(".Stage4Tracks");

const Stage4Settings = {
    StartDate: new Date("2025-08-01T00:00:00+05:00"),
    StageFadeInMs: 780,
    SlideTransitionMs: 560,
    TypewriterTitleDelayMs: 70,
    TypewriterBodyDelayMs: 70,
    TypewriterStartDelayMs: 200,
    TypewriterHoldMs: 180,
    MusicFadeStepMs: 50,
    TrackFadeOutMs: 1200,
    TrackFadeInMs: 1000,
    BackgroundMusicVolume: 0.65
};

const TrackList = [
    {
        src: "assets/audio/track-1.mp3",
        cover: "assets/images/track-1.jpg"
    },
    {
        src: "assets/audio/track-2.mp3",
        cover: "assets/images/track-2.jpg"
    },
    {
        src: "assets/audio/track-3.mp3",
        cover: "assets/images/track-3.jpg"
    }
];

let CurrentSlideIndex = 0;
let IsTransitioning = false;
let CurrentFadeTimerId = null;
let HasStage4Started = false;
let HasBackgroundMusicStarted = false;
let CurrentTypewriterSessionId = 0;
let IsTypingCurrentSlide = false;

function Wait(Milliseconds) {
    return new Promise((Resolve) => window.setTimeout(Resolve, Milliseconds));
}

function GetTypingDelay(Character, BaseDelayMs) {
    if (Character === " ") return Math.max(8, Math.round(BaseDelayMs * 0.35));
    if (Character === "\n") return Math.max(12, Math.round(BaseDelayMs * 0.8));
    if (/[,.!?…:;]/.test(Character)) return Math.max(60, Math.round(BaseDelayMs * 4));
    return Math.max(12, Math.round(BaseDelayMs * (0.9 + Math.random() * 0.2)));
}

function GetTimeSinceStart() {
    const Now = new Date();
    const DiffMs = Math.max(0, Now - Stage4Settings.StartDate);

    const TotalSeconds = Math.floor(DiffMs / 1000);
    const TotalMinutes = Math.floor(TotalSeconds / 60);
    const TotalDays = Math.floor(TotalMinutes / 1440);

    return {
        days: TotalDays,
        minutes: TotalMinutes,
        seconds: TotalSeconds
    };
}

function UpdateCounters() {
    const TimeSinceStart = GetTimeSinceStart();

    DaysCount.textContent = TimeSinceStart.days.toLocaleString("en-US");
    MinutesCount.textContent = TimeSinceStart.minutes.toLocaleString("en-US");
    SecondsCount.textContent = TimeSinceStart.seconds.toLocaleString("en-US");

    MorningThoughtsCount.textContent = Math.max(0, TimeSinceStart.days - 1).toLocaleString("en-US");
    NightThoughtsCount.textContent = TimeSinceStart.days.toLocaleString("en-US");
}

function StartCounterLoop() {
    UpdateCounters();
    window.setInterval(UpdateCounters, 1000);
}

function InitializeTypewriterTargets() {
    Stage4Slides.forEach((Slide) => {
        Slide.querySelectorAll(".Stage4Title, .Stage4Text").forEach((Element) => {
            if (!Element.dataset.fullText) {
                Element.dataset.fullText = Element.textContent.trim();
            }

            Element.textContent = "";
            Element.classList.add("Stage4Typewriter");
            Element.classList.remove("Stage4Typing", "Stage4Typed");
        });
    });
}

function ResetSlideForTyping(SlideIndex) {
    const Slide = Stage4Slides[SlideIndex];
    if (!Slide) return;

    Slide.querySelectorAll(".Stage4Title, .Stage4Text").forEach((Element) => {
        const FullText = Element.dataset.fullText || Element.textContent.trim();

        Element.dataset.fullText = FullText;
        Element.textContent = "";
        Element.classList.add("Stage4Typewriter");
        Element.classList.remove("Stage4Typing", "Stage4Typed");
    });

    if (SlideIndex !== 2 && Stage4Tracks) {
        Stage4Tracks.classList.remove("Stage4TracksVisible");
    }
}

function SkipCurrentTyping() {
    CurrentTypewriterSessionId += 1;
    IsTypingCurrentSlide = false;

    const Slide = Stage4Slides[CurrentSlideIndex];
    if (!Slide) return;

    Slide.querySelectorAll(".Stage4Title, .Stage4Text").forEach((Element) => {
        const FullText = Element.dataset.fullText || "";
        Element.textContent = FullText;
        Element.classList.remove("Stage4Typing");
        Element.classList.add("Stage4Typed");
    });

    if (CurrentSlideIndex === 2 && Stage4Tracks) {
        Stage4Tracks.classList.add("Stage4TracksVisible");
    }
}

async function AnimateTyping(Element, FullText, SessionId, Options = {}) {
    const BaseDelayMs = Options.baseDelayMs ?? 24;
    const StartDelayMs = Options.startDelayMs ?? 0;
    const HoldDelayMs = Options.holdDelayMs ?? 0;

    Element.classList.add("Stage4Typewriter", "Stage4Typing");
    Element.classList.remove("Stage4Typed");
    Element.textContent = "";

    if (StartDelayMs > 0) {
        await Wait(StartDelayMs);
    }

    if (SessionId !== CurrentTypewriterSessionId) return false;

    for (let Index = 0; Index < FullText.length; Index += 1) {
        if (SessionId !== CurrentTypewriterSessionId) return false;

        const Character = FullText[Index];
        Element.textContent += Character;

        await Wait(GetTypingDelay(Character, BaseDelayMs));
    }

    if (SessionId !== CurrentTypewriterSessionId) return false;

    Element.classList.remove("Stage4Typing");
    Element.classList.add("Stage4Typed");

    if (HoldDelayMs > 0) {
        await Wait(HoldDelayMs);
    }

    return SessionId === CurrentTypewriterSessionId;
}

async function TypeSlideContent(SlideIndex) {
    const SessionId = ++CurrentTypewriterSessionId;
    IsTypingCurrentSlide = true;

    const Slide = Stage4Slides[SlideIndex];
    if (!Slide) {
        IsTypingCurrentSlide = false;
        return;
    }

    const TitleElement = Slide.querySelector(".Stage4Title");
    const TextElement = Slide.querySelector(".Stage4Text");

    const Targets = [
        {
            element: TitleElement,
            baseDelayMs: Stage4Settings.TypewriterTitleDelayMs,
            startDelayMs: 120,
            holdDelayMs: 120
        },
        {
            element: TextElement,
            baseDelayMs: Stage4Settings.TypewriterBodyDelayMs,
            startDelayMs: Stage4Settings.TypewriterStartDelayMs,
            holdDelayMs: Stage4Settings.TypewriterHoldMs
        }
    ].filter((Target) => Target.element);

    for (const Target of Targets) {
        const FullText = Target.element.dataset.fullText || "";
        const DidFinish = await AnimateTyping(Target.element, FullText, SessionId, Target);

        if (!DidFinish) {
            IsTypingCurrentSlide = false;
            return;
        }
    }

    if (SessionId !== CurrentTypewriterSessionId) {
        IsTypingCurrentSlide = false;
        return;
    }

    IsTypingCurrentSlide = false;

    if (SlideIndex === 2 && Stage4Tracks) {
        Stage4Tracks.classList.add("Stage4TracksVisible");
    }
}

function ShowSlide(NextSlideIndex) {
    if (IsTransitioning || NextSlideIndex === CurrentSlideIndex) return;

    const CurrentSlide = Stage4Slides[CurrentSlideIndex];
    const NextSlide = Stage4Slides[NextSlideIndex];

    if (!CurrentSlide || !NextSlide) return;

    IsTransitioning = true;
    CurrentTypewriterSessionId += 1;
    IsTypingCurrentSlide = false;

    CurrentSlide.classList.remove("Stage4SlideActive");
    CurrentSlide.classList.add("Stage4SlideExitLeft");

    ResetSlideForTyping(NextSlideIndex);

    NextSlide.classList.add("Stage4SlideEnterRight");
    NextSlide.classList.add("Stage4SlideActive");

    window.requestAnimationFrame(() => {
        NextSlide.classList.remove("Stage4SlideEnterRight");
    });

    window.setTimeout(() => {
        CurrentSlide.classList.remove("Stage4SlideExitLeft");
        CurrentSlide.classList.remove("Stage4SlideActive");

        CurrentSlideIndex = NextSlideIndex;
        IsTransitioning = false;

        TypeSlideContent(NextSlideIndex);
    }, Stage4Settings.SlideTransitionMs);
}

function GoToNextSlide() {
    const NextSlideIndex = CurrentSlideIndex + 1;
    if (NextSlideIndex >= Stage4Slides.length) return;

    ShowSlide(NextSlideIndex);
}

function FadeAudio(AudioElement, TargetVolume, DurationMs, OnComplete) {
    if (!AudioElement) return;

    if (CurrentFadeTimerId !== null) {
        clearInterval(CurrentFadeTimerId);
        CurrentFadeTimerId = null;
    }

    const StartVolume = AudioElement.volume;
    const Steps = Math.max(1, Math.floor(DurationMs / Stage4Settings.MusicFadeStepMs));
    const VolumeStep = (TargetVolume - StartVolume) / Steps;
    let StepIndex = 0;

    CurrentFadeTimerId = window.setInterval(() => {
        StepIndex += 1;
        AudioElement.volume = Math.min(1, Math.max(0, AudioElement.volume + VolumeStep));

        if (StepIndex >= Steps) {
            clearInterval(CurrentFadeTimerId);
            CurrentFadeTimerId = null;
            AudioElement.volume = TargetVolume;
            OnComplete?.();
        }
    }, Stage4Settings.MusicFadeStepMs);
}

async function PlayBackgroundMusic() {
    if (HasBackgroundMusicStarted) return;

    HasBackgroundMusicStarted = true;
    RomanticAudio.volume = 0;
    RomanticAudio.currentTime = 0;

    try {
        await RomanticAudio.play();
        FadeAudio(RomanticAudio, Stage4Settings.BackgroundMusicVolume, 1200);
    } catch {
        HasBackgroundMusicStarted = false;
    }
}

async function PlayTrack(TrackIndex) {
    const Track = TrackList[TrackIndex];
    if (!Track) return;

    try {
        TrackAudio.pause();
        TrackAudio.src = Track.src;
        TrackAudio.currentTime = 0;
        TrackAudio.volume = 0;
        TrackAudio.onended = null;

        FadeAudio(RomanticAudio, 0, Stage4Settings.TrackFadeOutMs, async () => {
            try {
                await TrackAudio.play();

                FadeAudio(TrackAudio, 0.9, Stage4Settings.TrackFadeInMs, () => {
                    TrackAudio.onended = () => {
                        FadeAudio(TrackAudio, 0, 600, () => {
                            TrackAudio.pause();
                            TrackAudio.currentTime = 0;
                            FadeAudio(RomanticAudio, Stage4Settings.BackgroundMusicVolume, 1200);
                        });
                    };
                });
            } catch {
                FadeAudio(RomanticAudio, Stage4Settings.BackgroundMusicVolume, 800);
            }
        });
    } catch {
        FadeAudio(RomanticAudio, Stage4Settings.BackgroundMusicVolume, 800);
    }
}

function HandleTrackClick(Event) {
    const Button = Event.currentTarget;
    const TrackIndex = Number(Button.dataset.track);

    if (Number.isNaN(TrackIndex)) return;
    PlayTrack(TrackIndex);
}

function HandleStage4Click() {
    if (IsTransitioning) return;

    if (IsTypingCurrentSlide) {
        SkipCurrentTyping();
        return;
    }

    if (CurrentSlideIndex < Stage4Slides.length - 1) {
        GoToNextSlide();
    }
}

function EnterStage4() {
    if (HasStage4Started) return;
    HasStage4Started = true;

    InitializeTypewriterTargets();

    Stage4.classList.remove("StageHidden");
    Stage4.classList.add("StageVisible");
    Stage4.setAttribute("aria-hidden", "false");

    window.requestAnimationFrame(() => {
        Stage4.classList.add("Stage4Ready");
    });

    StartCounterLoop();
    window.setTimeout(PlayBackgroundMusic, 250);

    Stage4.addEventListener("click", HandleStage4Click);

    TrackButtons.forEach((Button) => {
        Button.addEventListener("click", (Event) => {
            Event.stopPropagation();
            HandleTrackClick(Event);
        });
    });

    ResetSlideForTyping(0);
    window.setTimeout(() => {
        TypeSlideContent(0);
    }, 420);
}

window.EnterStage4 = EnterStage4;