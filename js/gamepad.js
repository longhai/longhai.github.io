(function(window) {
    var gamepad = {
        gamepads: [],
        listeners: {},
        
        init: function() {
            window.addEventListener("gamepadconnected", (e) => this.connectHandler(e));
            window.addEventListener("gamepaddisconnected", (e) => this.disconnectHandler(e));
        },
        
        connectHandler: function(e) {
            this.gamepads[e.gamepad.index] = e.gamepad;
        },
        
        disconnectHandler: function(e) {
            delete this.gamepads[e.gamepad.index];
        },
        
        on: function(event, callback) {
            if (!this.listeners[event]) {
                this.listeners[event] = [];
            }
            this.listeners[event].push(callback);
        },
        
        poll: function() {
            const gp = navigator.getGamepads();
            for (let i = 0; i < gp.length; i++) {
                const gamepad = gp[i];
                if (!gamepad) continue;
                
                for (let j = 0; j < gamepad.axes.length; j++) {
                    if (Math.abs(gamepad.axes[j]) > 0.5) {
                        this.emit('axis', j, gamepad.axes[j]);
                    }
                }
                
                for (let j = 0; j < gamepad.buttons.length; j++) {
                    if (gamepad.buttons[j].pressed) {
                        this.emit('button', j, gamepad.buttons[j].value);
                    }
                }
            }
        },
        
        emit: function(event, index, value) {
            if (this.listeners[event]) {
                this.listeners[event].forEach(callback => callback(index, value));
            }
        }
    };
    
    window.gamepad = gamepad;
    setInterval(() => gamepad.poll(), 100); // Kiểm tra sự kiện tay cầm mỗi 100ms
})(window);