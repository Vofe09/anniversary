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

const Stage4Settings = {
    StartDate: new Date("2025-08-01T00:00:00+05:00"),
    SlideTransitionMs: 520,
    MusicFadeStepMs: 50,
    MusicFadeStepAmount: 0.05,
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
let CurrentTrackIndex = null;
let HasStage4Started = false;
let HasBackgroundMusicStarted = false;

function PadTwo(value) {
    return String(value).padStart(2, "0");
}

function GetTimeSinceStart() {
    const now = new Date();
    const diffMs = Math.max(0, now - Stage4Settings.StartDate);

    const totalSeconds = Math.floor(diffMs / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalDays = Math.floor(totalMinutes / 1440);

    return {
        days: totalDays,
        minutes: totalMinutes,
        seconds: totalSeconds
    };
}

function UpdateCounters() {
    const timeSinceStart = GetTimeSinceStart();

    DaysCount.textContent = timeSinceStart.days.toLocaleString("en-US");
    MinutesCount.textContent = timeSinceStart.minutes.toLocaleString("en-US");
    SecondsCount.textContent = timeSinceStart.seconds.toLocaleString("en-US");

    MorningThoughtsCount.textContent = Math.max(0, timeSinceStart.days - 1).toLocaleString("en-US");
    NightThoughtsCount.textContent = timeSinceStart.days.toLocaleString("en-US");
}

function StartCounterLoop() {
    UpdateCounters();
    window.setInterval(UpdateCounters, 1000);
}

function ShowSlide(nextSlideIndex) {
    if (IsTransitioning || nextSlideIndex === CurrentSlideIndex) return;

    const currentSlide = Stage4Slides[CurrentSlideIndex];
    const nextSlide = Stage4Slides[nextSlideIndex];

    IsTransitioning = true;

    currentSlide.classList.remove("Stage4SlideActive");
    currentSlide.classList.add("Stage4SlideExitLeft");

    nextSlide.classList.remove("Stage4SlideEnterRight");
    nextSlide.classList.add("Stage4SlideActive");

    window.setTimeout(() => {
        currentSlide.classList.remove("Stage4SlideExitLeft");
        nextSlide.classList.remove("Stage4SlideEnterRight");
        CurrentSlideIndex = nextSlideIndex;
        IsTransitioning = false;
    }, Stage4Settings.SlideTransitionMs);
}

function GoToNextSlide() {
    const nextSlideIndex = CurrentSlideIndex + 1;
    if (nextSlideIndex >= Stage4Slides.length) return;

    ShowSlide(nextSlideIndex);
}

function FadeAudio(audioElement, targetVolume, durationMs, onComplete) {
    if (!audioElement) return;

    if (CurrentFadeTimerId !== null) {
        clearInterval(CurrentFadeTimerId);
        CurrentFadeTimerId = null;
    }

    const startVolume = audioElement.volume;
    const steps = Math.max(1, Math.floor(durationMs / Stage4Settings.MusicFadeStepMs));
    const volumeStep = (targetVolume - startVolume) / steps;
    let stepIndex = 0;

    CurrentFadeTimerId = window.setInterval(() => {
        stepIndex += 1;
        audioElement.volume = Math.min(1, Math.max(0, audioElement.volume + volumeStep));

        if (stepIndex >= steps) {
            clearInterval(CurrentFadeTimerId);
            CurrentFadeTimerId = null;
            audioElement.volume = targetVolume;
            onComplete?.();
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

async function PlayTrack(trackIndex) {
    const track = TrackList[trackIndex];
    if (!track) return;

    CurrentTrackIndex = trackIndex;

    try {
        TrackAudio.pause();
        TrackAudio.src = track.src;
        TrackAudio.currentTime = 0;
        TrackAudio.volume = 0;

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

function HandleTrackClick(event) {
    const button = event.currentTarget;
    const trackIndex = Number(button.dataset.track);

    if (Number.isNaN(trackIndex)) return;
    PlayTrack(trackIndex);
}

function HandleStage4Click() {
    if (CurrentSlideIndex < Stage4Slides.length - 1) {
        GoToNextSlide();
    }
}

function EnterStage4() {
    if (HasStage4Started) return;
    HasStage4Started = true;

    Stage4.classList.remove("StageHidden");
    Stage4.classList.add("StageVisible");
    Stage4.setAttribute("aria-hidden", "false");

    StartCounterLoop();
    PlayBackgroundMusic();

    Stage4.addEventListener("click", HandleStage4Click);

    TrackButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            event.stopPropagation();
            HandleTrackClick(event);
        });
    });
}

window.EnterStage4 = EnterStage4;