import { world, system } from '@minecraft/server';
import { ActionFormData, ModalFormData } from '@minecraft/server-ui';

let activeInterval = null;

world.afterEvents.itemUse.subscribe((event) => {
    const player = event.source;
    if (event.itemStack.typeId === "minecraft:clock") {
        showTimerUI(player);
    }
});

async function showTimerUI(player) {
    const form = new ActionFormData();
    form.title("タイマー");
    form.body("");
    form.button("カウントダウンタイマー");
    form.button("リセットタイマー");

    const { canceled, selection } = await form.show(player);
    if (canceled) return;

    if (selection === 0) {
        showCountdownTimerUI(player);
    } else if (selection === 1) {
        resetTimer(player);
    }
}

async function showCountdownTimerUI(player) {
    const form = new ModalFormData();
    form.title("カウントダウンタイマー設定");
    form.textField("時間（分）", "例: 10", "10");
    form.textField("時間（秒）", "例: 30", "30");

    const { formValues, canceled } = await form.show(player);
    if (canceled) return;

    const minutes = parseInt(formValues[0]);
    const seconds = parseInt(formValues[1]);

    if (isNaN(minutes) || isNaN(seconds)) {
        player.runCommand("say 無効な入力です。");
        return;
    }

    startCountdownTimer(player, minutes * 60 + seconds);
}

function startCountdownTimer(player, totalSeconds) {
    if (activeInterval !== null) {
        player.runCommand("say 既にタイマーが実行中です。リセットしてください。");
        return;
    }

    activeInterval = system.runInterval(() => {
        if (totalSeconds >= 0) {
            const formattedTime = formatTime(totalSeconds);
            for (const player of world.getAllPlayers()) {
                player.runCommand(`title @s actionbar ${formattedTime}`);
            }
            totalSeconds--;
        } else {
            for (const player of world.getAllPlayers()) {
                player.runCommand(`title @s actionbar 終了！`);
            }
        }
    }, 20); // 20ティック（約1秒）ごとに実行
}

function resetTimer(player) {
    if (activeInterval !== null) {
        system.clearRun(activeInterval);
        activeInterval = null;
        for (const player of world.getAllPlayers()) {
            player.runCommand(`title @s actionbar タイマーをリセットしました`);
        }
    } else {
        player.runCommand("say 現在、実行中のタイマーはありません。");
    }
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const hStr = h < 10 ? "0" + h : h;
    const mStr = m < 10 ? "0" + m : m;
    const sStr = s < 10 ? "0" + s : s;
    return `${hStr}:${mStr}:${sStr}`;
}