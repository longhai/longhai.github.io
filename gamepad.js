document.addEventListener("DOMContentLoaded", () => {
    const gamelist = document.getElementById('gameList');
    let currentIndex = 0;
    let gameOpen = false; // Biến để theo dõi trạng thái trò chơi
    const state = {
        lastMoveTime: 0,
        moveInterval: 150
    };

    // Keyboard and gamepad controls
    document.addEventListener("keydown", (event) => {
        if (gameOpen) return; // Nếu trò chơi đang mở, không xử lý phím
        if (event.key === "Enter") {
            openGame(currentIndex);
        } else {
            handleKeyboardNavigation(event.key);
        }
    });

    window.addEventListener("gamepadconnected", () => updateGamepad());
    window.addEventListener("gamepaddisconnected", () =>
        console.log("Gamepad disconnected")
    );

    // Mouse click controls
    gamelist.addEventListener("click", (event) => {
        if (event.target.classList.contains('item')) {
            currentIndex = parseInt(event.target.getAttribute('data-index'));
            highlightItem(currentIndex);
        }
    });

    function handleKeyboardNavigation(key) {
        const columns = Math.floor(gamelist.clientWidth / getItemWidth());
        switch (key) {
            case "ArrowRight":
                if (currentIndex < gamelist.children.length - 1) currentIndex++;
                break;
            case "ArrowLeft":
                if (currentIndex > 0) currentIndex--;
                break;
            case "ArrowDown":
                if (currentIndex + columns < gamelist.children.length)
                    currentIndex += columns;
                break;
            case "ArrowUp":
                if (currentIndex - columns >= 0) currentIndex -= columns;
                break;
        }
        highlightItem(currentIndex);
    }

    function updateGamepad() {
        const gamepads = navigator.getGamepads();
        const gp = gamepads[0];
        if (!gp) return;
        const currentTime = Date.now();
        const axes = gp.axes;
        const buttons = gp.buttons;

        if (currentTime - state.lastMoveTime > state.moveInterval) {
            if (axes[0] > 0.5) {
                handleGamepadNavigation("ArrowRight");
                state.lastMoveTime = currentTime;
            } else if (axes[0] < -0.5) {
                handleGamepadNavigation("ArrowLeft");
                state.lastMoveTime = currentTime;
            } else if (axes[1] > 0.5) {
                handleGamepadNavigation("ArrowDown");
                state.lastMoveTime = currentTime;
            } else if (axes[1] < -0.5) {
                handleGamepadNavigation("ArrowUp");
                state.lastMoveTime = currentTime;
            }

            // Mở trò chơi nếu button 0 được nhấn và chưa mở trò chơi
            if (buttons[0].pressed && !gameOpen) {
                openGame(currentIndex);
            }

            // Đóng trò chơi nếu button 11 được nhấn
            if (buttons[11].pressed && gameOpen) {
                closeGame();
            }
        }
        requestAnimationFrame(updateGamepad);
    }

    function handleGamepadNavigation(direction) {
        handleKeyboardNavigation(direction);
    }

    function getItemWidth() {
        return gamelist.querySelector(".item").offsetWidth;
    }

    function highlightItem(index) {
        const items = gamelist.children;
        if (index < 0 || index >= items.length) return;

        // Remove highlight from all items
        Array.from(items).forEach(item => item.classList.remove('highlight'));

        // Add highlight to the current item
        const currentItem = items[index];
        currentItem.classList.add('highlight');

        // Scroll the item into view
        currentItem.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest'
        });
    }

    function openGame(index) {
        const items = gamelist.children;
        if (index < 0 || index >= items.length) return;
        const gameItem = items[index];
        const url = gameItem.getAttribute('data-url');
        if (url) {
            gameOpen = true; // Đánh dấu trò chơi đang mở
            document.getElementById('gameFrame').src = `load.html?url=${encodeURIComponent(url)}`;
            document.getElementById('gameOverlay').style.display = 'flex';
        }
    }

    function closeGame() {
        gameOpen = false; // Đặt lại trạng thái trò chơi
        document.getElementById('gameOverlay').style.display = 'none';
        document.getElementById('gameFrame').src = ""; // Dừng trò chơi
    }
});
