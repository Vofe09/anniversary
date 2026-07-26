const Stage2 = document.getElementById("Stage2");
const EnvelopeButton = document.getElementById("EnvelopeButton");
const EnvelopeSprite = document.getElementById("EnvelopeSprite");
const StageHint = document.getElementById("StageHint");

const EnvelopeSettings = {
    FrameCount: 7,
    FramesPerSecond: 30,
    AssetRoot: "assets/animation/envelope/open"
};

const PaperSettings = {
    RevealDelayMs: 220,
    TypewriterStartDelayMs: 240,
    CharacterDelayMs: 34,
    AfterEnvelopeOpenDelayMs: 650,
    BeforeEnvelopeCloseDelayMs: 650
};

// Replace this array with your final wishes text.
const LetterCopy = [
    "Write your text here.",
    "You can add as many lines as you need.",
    "",
    "This will be typed letter by letter."
];

const EnvelopeFrames = Array.from({ length: EnvelopeSettings.FrameCount }, (_, index) => {
    const FrameNumber = String(index + 1).padStart(3, "0");
    return `${EnvelopeSettings.AssetRoot}/frame${FrameNumber}.png`;
});

let CurrentState = "idle"; // idle | opening | revealingPaper | typing | open | closingPaper | closingEnvelope | exiting
let CurrentFrameIndex = 0;
let AnimationTimerId = null;
let TypewriterTimerId = null;
let HasStage2Started = false;
let PaperElement = null;
let PaperTextElement = null;
let LetterText = "";
let TypedCharactersCount = 0;

function PreloadFrames(FrameList) {
    for (const FrameUrl of FrameList) {
        const ImageElement = new Image();
        ImageElement.src = FrameUrl;
    }
}

function StopEnvelopeAnimation() {
    if (AnimationTimerId !== null) {
        clearInterval(AnimationTimerId);
        AnimationTimerId = null;
    }
}

function StopTyping() {
    if (TypewriterTimerId !== null) {
        clearInterval(TypewriterTimerId);
        TypewriterTimerId = null;
    }
}

function SetFrame(FrameUrl) {
    EnvelopeSprite.src = FrameUrl;
}

function EnsurePaper() {
    if (PaperElement) return;

    PaperElement = document.createElement("div");
    PaperElement.className = "LetterPaper LetterPaperHidden";

    const PaperInner = document.createElement("div");
    PaperInner.className = "LetterPaperInner";

    PaperTextElement = document.createElement("div");
    PaperTextElement.className = "LetterPaperText";
    PaperTextElement.setAttribute("aria-live", "polite");

    PaperInner.appendChild(PaperTextElement);
    PaperElement.appendChild(PaperInner);
    Stage2.appendChild(PaperElement);
}

function SetPaperHidden() {
    if (!PaperElement) return;

    PaperElement.classList.remove("LetterPaperVisible", "LetterPaperTyping", "LetterPaperTyped");
    PaperElement.classList.add("LetterPaperHidden");
}

function ShowPaper() {
    EnsurePaper();
    SetPaperHidden();

    void PaperElement.offsetWidth;

    PaperElement.classList.remove("LetterPaperHidden");
    PaperElement.classList.add("LetterPaperVisible");
}

function HidePaper() {
    if (!PaperElement) return;

    StopTyping();
    SetPaperHidden();
}

function ResetPaperText() {
    StopTyping();
    LetterText = LetterCopy.join("\n");
    TypedCharactersCount = 0;

    if (PaperTextElement) {
        PaperTextElement.textContent = "";
    }

    PaperElement?.classList.remove("LetterPaperTyping", "LetterPaperTyped");
}

function StartTyping() {
    if (!PaperTextElement) return;

    StopTyping();
    CurrentState = "typing";
    TypedCharactersCount = 0;
    PaperElement?.classList.add("LetterPaperTyping");
    PaperElement?.classList.remove("LetterPaperTyped");
    PaperTextElement.textContent = "";

    TypewriterTimerId = window.setInterval(() => {
        if (TypedCharactersCount >= LetterText.length) {
            StopTyping();
            CurrentState = "open";
            PaperElement?.classList.remove("LetterPaperTyping");
            PaperElement?.classList.add("LetterPaperTyped");
            StageHint.textContent = "Tap again to close";
            return;
        }

        TypedCharactersCount += 1;
        PaperTextElement.textContent = LetterText.slice(0, TypedCharactersCount);
    }, PaperSettings.CharacterDelayMs);
}

function RevealPaperAndType() {
    CurrentState = "revealingPaper";
    StageHint.textContent = "Writing...";
    window.setTimeout(() => {

        ShowPaper();
        ResetPaperText();

        window.setTimeout(() => {
            StartTyping();
        }, PaperSettings.TypewriterStartDelayMs);

    }, PaperSettings.AfterEnvelopeOpenDelayMs);
}

function PlayEnvelopeFrames(Direction, OnComplete) {
    StopEnvelopeAnimation();

    CurrentState = Direction === 1 ? "opening" : "closingEnvelope";
    CurrentFrameIndex = Direction === 1 ? 0 : EnvelopeFrames.length - 1;

    SetFrame(EnvelopeFrames[CurrentFrameIndex]);

    AnimationTimerId = window.setInterval(() => {
        CurrentFrameIndex += Direction;

        const IsOutOfBounds =
            CurrentFrameIndex < 0 || CurrentFrameIndex >= EnvelopeFrames.length;

        if (IsOutOfBounds) {
            StopEnvelopeAnimation();
            OnComplete?.();
            return;
        }

        SetFrame(EnvelopeFrames[CurrentFrameIndex]);
    }, 1000 / EnvelopeSettings.FramesPerSecond);
}

function ExitStage2() {
    if (CurrentState === "exiting") return;

    CurrentState = "exiting";
    StopEnvelopeAnimation();
    StopTyping();
    StageHint.textContent = "";

    Stage2.classList.add("StageExiting");

    window.setTimeout(() => {
        Stage2.classList.remove("StageVisible");
        Stage2.classList.remove("StageExiting");
        Stage2.classList.add("StageHidden");
        Stage2.setAttribute("aria-hidden", "true");

        window.dispatchEvent(new CustomEvent("stage2complete"));

        if (typeof window.EnterStage4=== "function") {
            window.EnterStage4();
        }
    }, 700);
}

function ClosePaperAndEnvelope() {
    if (CurrentState === "closingPaper" || CurrentState === "closingEnvelope" || CurrentState === "exiting") {
        return;
    }

    CurrentState = "closingPaper";
    StageHint.textContent = "Closing...";

    StopTyping();

    if (PaperElement) {
        PaperElement.classList.remove("LetterPaperTyping", "LetterPaperTyped");
        PaperElement.classList.add("LetterPaperHidden");
    }

    window.setTimeout(() => {

        HidePaper();

        window.setTimeout(() => {

            PlayEnvelopeFrames(-1, () => {
                ExitStage2();
            });

        }, PaperSettings.BeforeEnvelopeCloseDelayMs);

    }, PaperSettings.RevealDelayMs);
}

function HandleEnvelopeClick() {
    if (CurrentState === "opening" || CurrentState === "closingPaper" || CurrentState === "closingEnvelope" || CurrentState === "exiting") {
        return;
    }

    if (CurrentState === "idle") {
        CurrentState = "opening";
        StageHint.textContent = "Opening...";

        PlayEnvelopeFrames(1, () => {
            RevealPaperAndType();
        });
        return;
    }

    if (CurrentState === "typing") {
        StopTyping();
        if (PaperTextElement) {
            PaperTextElement.textContent = LetterText;
        }
        PaperElement?.classList.remove("LetterPaperTyping");
        PaperElement?.classList.add("LetterPaperTyped");
        CurrentState = "open";
        StageHint.textContent = "Tap again to close";
        return;
    }

    if (CurrentState === "open") {
        ClosePaperAndEnvelope();
    }
}

function EnterStage2() {
    if (HasStage2Started) return;
    HasStage2Started = true;

    Stage2.classList.remove("StageHidden");
    Stage2.classList.add("StageVisible");
    Stage2.setAttribute("aria-hidden", "false");

    PreloadFrames(EnvelopeFrames);
    EnsurePaper();
    ResetPaperText();
    HidePaper();

    EnvelopeSprite.src = "assets/images/envelope-closed.png";
    CurrentState = "idle";
    StageHint.textContent = "Tap to open";
}

EnvelopeButton.addEventListener("click", HandleEnvelopeClick);

window.EnterStage2 = EnterStage2;