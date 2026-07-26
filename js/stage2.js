const Stage2 = document.getElementById("Stage2");
const EnvelopeButton = document.getElementById("EnvelopeButton");
const EnvelopeSprite = document.getElementById("EnvelopeSprite");
const StageHint = document.getElementById("StageHint");

const SpriteSettings = {
    FrameCount: 7,
    FramesPerSecond: 2,
    FrameDelay: 1000 / 30,
    AssetRoot: "assets/animation/envelope/open"
};

const EnvelopeFrames = Array.from({ length: SpriteSettings.FrameCount }, (_, index) => {
    const FrameNumber = String(index + 1).padStart(3, "0");
    return `${SpriteSettings.AssetRoot}/frame${FrameNumber}.png`;
});

let CurrentState = "idle"; // idle | opening | open | closing | exiting
let CurrentFrameIndex = 0;
let AnimationTimerId = null;
let HasStage2Started = false;

function PreloadFrames(FrameList) {
    for (const FrameUrl of FrameList) {
        const ImageElement = new Image();
        ImageElement.src = FrameUrl;
    }
}

function StopAnimation() {
    if (AnimationTimerId !== null) {
        clearInterval(AnimationTimerId);
        AnimationTimerId = null;
    }
}

function SetFrame(FrameUrl) {
    EnvelopeSprite.src = FrameUrl;
}

function PlaySpriteAnimation(Direction, OnComplete) {
    StopAnimation();

    CurrentState = Direction === 1 ? "opening" : "closing";
    CurrentFrameIndex = Direction === 1 ? 0 : EnvelopeFrames.length - 1;

    SetFrame(EnvelopeFrames[CurrentFrameIndex]);

    AnimationTimerId = setInterval(() => {
        CurrentFrameIndex += Direction;

        const IsOutOfBounds =
            CurrentFrameIndex < 0 || CurrentFrameIndex >= EnvelopeFrames.length;

        if (IsOutOfBounds) {
            StopAnimation();
            OnComplete?.();
            return;
        }

        SetFrame(EnvelopeFrames[CurrentFrameIndex]);
    }, SpriteSettings.FrameDelay);
}

function EnterStage2() {
    if (HasStage2Started) return;
    HasStage2Started = true;

    Stage2.classList.remove("StageHidden");
    Stage2.classList.add("StageVisible");
    Stage2.setAttribute("aria-hidden", "false");

    PreloadFrames(EnvelopeFrames);

    EnvelopeSprite.src = "assets/images/envelope-closed.png";
    CurrentState = "idle";
    StageHint.textContent = "Tap to open";
}

function ExitStage2() {
    if (CurrentState === "exiting") return;

    CurrentState = "exiting";
    StopAnimation();

    Stage2.classList.add("StageExiting");

    window.setTimeout(() => {
        Stage2.classList.remove("StageVisible");
        Stage2.classList.remove("StageExiting");
        Stage2.classList.add("StageHidden");
        Stage2.setAttribute("aria-hidden", "true");

        window.dispatchEvent(new CustomEvent("stage2complete"));

        if (typeof window.EnterStage3 === "function") {
            window.EnterStage3();
        }
    }, 700);
}

function HandleEnvelopeClick() {
    if (CurrentState === "opening" || CurrentState === "closing" || CurrentState === "exiting") {
        return;
    }

    if (CurrentState === "idle") {
        StageHint.textContent = "Opening...";
        PlaySpriteAnimation(1, () => {
            CurrentState = "open";
            StageHint.textContent = "Tap again to close";
        });
        return;
    }

    if (CurrentState === "open") {
        StageHint.textContent = "Closing...";
        PlaySpriteAnimation(-1, () => {
            ExitStage2();
        });
    }
}

EnvelopeButton.addEventListener("click", HandleEnvelopeClick);

window.EnterStage2 = EnterStage2;