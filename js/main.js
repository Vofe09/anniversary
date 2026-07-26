const Stage1 = document.getElementById("Stage1");
const OpenButton = document.getElementById("OpenButton");

let HasStartedTransition = false;

function GoToNextStage() {
    if (HasStartedTransition) return;
    HasStartedTransition = true;

    Stage1.classList.add("StageExiting");

    window.setTimeout(() => {
        Stage1.classList.remove("StageVisible");
        Stage1.classList.add("StageHidden");

        if (typeof window.EnterStage2 === "function") {
            window.EnterStage2();
        }

        window.dispatchEvent(new CustomEvent("stage1complete"));
    }, 900);
}

function HandleOpenClick() {
    GoToNextStage();
}

OpenButton.addEventListener("click", HandleOpenClick);

document.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
        GoToNextStage();
    }
});