type TerminalCommand = (term: Terminal, ...args: string[]) => void;
interface TerminalCommandOptions {
    description?: string;
}

export class Terminal {
    private terminalContainerElement: HTMLElement;
    private terminalPromptElement!: HTMLSpanElement;
    private terminalInputElement!: HTMLInputElement;
    private terminalOutputElement!: HTMLElement;
    private commands = new Map<
        String,
        [TerminalCommand, TerminalCommandOptions | undefined]
    >();
    private commandHistory: string[] = [];
    private prompt = "";

    constructor(terminalContainerElement: HTMLElement) {
        this.terminalContainerElement = terminalContainerElement;

        this.initializeDOM();
        this.initializeInput();
        this.registerDefaultCommands();
    }

    private initializeDOM() {
        const termOutput = document.createElement("div");
        termOutput.style.whiteSpace = "pre-wrap";
        this.terminalContainerElement.append(termOutput);
        this.terminalOutputElement = termOutput;

        const termInputWrapper = document.createElement("div");
        this.terminalContainerElement.append(termInputWrapper);

        const termPrompt = document.createElement("span");
        termPrompt.innerHTML = this.prompt;
        termInputWrapper.append(termPrompt);
        this.terminalPromptElement = termPrompt;

        const termInput = document.createElement("input");
        termInput.type = "text";
        termInput.classList.add("terminal-input");
        termInputWrapper.append(termInput);
        this.terminalInputElement = termInput;

        termInput.focus();
    }

    private initializeInput() {
        let commandHistoryIndex = 0;
        this.terminalInputElement.addEventListener("keydown", (e) => {
            const val = this.terminalInputElement.value;
            if (e.code == "Enter") {
                this.commandHistory.push(val);
                commandHistoryIndex = this.commandHistory.length;
                this.println(this.prompt + val);
                this.execute(val);
                this.terminalInputElement.value = "";
            }

            if (e.code == "ArrowUp" && commandHistoryIndex > 0) {
                e.preventDefault();
                commandHistoryIndex--;
                this.terminalInputElement.value =
                    this.commandHistory[commandHistoryIndex];
                this.terminalInputElement.setSelectionRange(
                    this.commandHistory[commandHistoryIndex].length,
                    this.commandHistory[commandHistoryIndex].length
                );
            }

            if (
                e.code == "ArrowDown" &&
                commandHistoryIndex < this.commandHistory.length
            ) {
                e.preventDefault();
                commandHistoryIndex++;

                if (!this.commandHistory[commandHistoryIndex]) {
                    this.terminalInputElement.value = "";
                } else {
                    this.terminalInputElement.value =
                        this.commandHistory[commandHistoryIndex];
                    this.terminalInputElement.setSelectionRange(
                        this.commandHistory[commandHistoryIndex].length,
                        this.commandHistory[commandHistoryIndex].length
                    );
                }
            }
        });
    }

    private registerDefaultCommands() {
        this.registerCommand(
            "clear",
            () => {
                this.clear();
            },
            {
                description: "Clears the terminal",
            }
        );

        this.registerCommand(
            "help",
            () => {
                let availableCommands = "";
                this.commands.forEach(([_fn, options], command) => {
                    availableCommands += `\n\t${command}`;
                    if (options?.description)
                        availableCommands += ` - ${options.description}`;
                });
                this.println(`Available commands:${availableCommands}`);
            },
            {
                description: "Displays this help page",
            }
        );
    }

    public setPrompt(prompt: string) {
        this.prompt = prompt;
        this.terminalPromptElement.innerHTML = prompt;
    }

    public registerCommand(
        name: string,
        fn: TerminalCommand,
        options?: TerminalCommandOptions
    ) {
        if (/\s/g.test(name)) {
            throw new Error("Command name should not have whitespace.");
        }

        this.commands.set(name, [fn.bind(this), options]);
    }

    public execute(contents: string) {
        const spacePos = contents.indexOf(" ");

        let command;
        let args: string[] = [];
        if (spacePos <= 0) {
            command = contents;
        } else {
            command = contents.substring(0, spacePos);
            args = contents.substring(spacePos + 1).split(" ");
        }

        if (!this.commands.has(command)) {
            this.println(`${command}: command not found`);
            return;
        }

        this.commands.get(command)![0](this, ...args);
    }

    public print(message: string) {
        this.terminalOutputElement.innerHTML += message;
    }

    public println(message: string) {
        this.terminalOutputElement.innerHTML += message + "\n";
    }

    public clear() {
        this.terminalOutputElement.innerHTML = "";
    }
}
