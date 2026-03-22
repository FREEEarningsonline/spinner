      // --- REAL PAKISTANI NAMES FOR OPPONENTS ---
        const PAKISTANI_NAMES = [
            'Ayesha','Fatima','Maria','Hina','Zainab','Sara','Iqra','Mehreen','Nida',
            'Aiman','Amna','Anaya','Areeba','Arisha','Arooj','Asma','Ayat','Azka','Benish',
            'Bushra','Dua','Eman','Esha','Fariha','Farwa','Hafsa','Hajra','Hiba','Humaira',
            'Ifrah','Inaya','Iram','Isma','Javeria','Kainat','Kanza','Komal','Laiba','Lubna',
            'Maham','Mahnoor','Malaika','Mariam','Mehwish','Minal','Misbah','Momina','Nabeela','Nadia',
            'Naima','Naila','Nashra','Neelam','Nimra','Noor','Rabab','Rabia','Ramsha','Rania',
            'Rashida','Rida','Rimsha','Saba','Sadia','Saima','Samina','Saniya','Shanza',
            'Shazia','Sidra','Sobia','Sonia','Sumaira','Tabassum','Tahira','Tania','Tehmina','Uzma',
            'Wajiha','Yasmin','Yumna','Zara','Zarmeen','Zehra','Zoya','Zunaira','Sehrish',
            'Aleena','Alishba','Anum','Aqsa','Bareera','Erum','Falak','Ghazal','Hoorain','Jannat',
            'Kashaf','Laraib','Mahira','Nargis','Qandeel','Rukhsar','Sahar','Shifa','Tooba','Zimal'
        ];

        function getRandomNames(count) {
            let shuffled = PAKISTANI_NAMES.sort(() => 0.5 - Math.random());
            return shuffled.slice(0, count);
        }

        // --- Firebase Config ---
        const firebaseConfig = {
            apiKey: "AIzaSyDR2OugzoVNnKN6OUKsPxC9ajldlhanteE",
            authDomain: "tournament-af6dd.firebaseapp.com",
            databaseURL: "https://tournament-af6dd-default-rtdb.firebaseio.com",
            projectId: "tournament-af6dd",
            storageBucket: "tournament-af6dd.firebasestorage.app",
            messagingSenderId: "726964405659",
            appId: "1:726964405659:web:d03f72c2d6f8721bc98d3e"
        };
        firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();
        const db = firebase.database();

        // --- DOM Elements ---
        const screens = { auth: document.getElementById('auth-screen'), menu: document.getElementById('menu-screen'), game: document.getElementById('game-screen') };
        const walletDisplay = document.getElementById('wallet-display');
        const turnIndicator = document.getElementById('turn-indicator');
        const wheelEl = document.getElementById('spinner-wheel');
        const userSpinBtn = document.getElementById('user-spin-btn');
        const profileBtn = document.getElementById('profile-btn');
        const profileDropdown = document.getElementById('profile-dropdown');
        const userEmailDisplay = document.getElementById('user-email-display');

        // --- Header Profile Actions ---
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            profileDropdown.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if(!profileDropdown.contains(e.target) && !profileBtn.contains(e.target)) {
                profileDropdown.classList.remove('active');
            }
        });

        // --- Game Logic Variables ---
        let currentUser = null;
        let walletBalance = 0;
        const ENTRY_FEE = 75;
        const GOAL_STEPS = 50;
        const USER_MAX_LIMIT = 40; 
        
        let currentTurn = 0; 
        let currentRotation = 0;
        let isSpinning = false;
        
        let players = [
            { name: "YOU", color: "var(--neon-red)", steps: 0, card: document.getElementById('card-0'), stepTxt: document.getElementById('steps-0'), bar: document.getElementById('bar-0') },
            { name: "CPU 1", color: "var(--neon-blue)", steps: 0, card: document.getElementById('card-1'), stepTxt: document.getElementById('steps-1'), bar: document.getElementById('bar-1') },
            { name: "CPU 2", color: "var(--neon-green)", steps: 0, card: document.getElementById('card-2'), stepTxt: document.getElementById('steps-2'), bar: document.getElementById('bar-2') },
            { name: "CPU 3", color: "var(--neon-yellow)", steps: 0, card: document.getElementById('card-3'), stepTxt: document.getElementById('steps-3'), bar: document.getElementById('bar-3') }
        ];

        // Ludo Numbers (Included '50' for Jackpot)
        // Index 4 is now '50' with Gold color
        const segments = [
            { val: 0, color: "#ff2a2a" },  // Index 0: 0
            { val: 1, color: "#00d4ff" },  // Index 1: 1
            { val: 5, color: "#00ff55" },  // Index 2: 5
            { val: 2, color: "#ffea00" },  // Index 3: 2
            { val: 50, color: "#ffd700" }, // Index 4: 50 (GOLD - INSTANT WIN)
            { val: 3, color: "#ffa500" },  // Index 5: 3
            { val: 6, color: "#00d4ff" },  // Index 6: 6
            { val: 0, color: "#ff2a2a" }   // Index 7: 0
        ];

        // --- Initialize Spinner UI ---
        function initWheel() {
            segments.forEach((seg, i) => {
                const angle = i * 45; 
                const div = document.createElement('div');
                div.className = 'segment-number';
                div.style.transform = `translateX(-50%) rotate(${angle}deg)`;
                
                const span = document.createElement('span');
                span.textContent = seg.val;
                span.style.color = seg.color;
                
                div.appendChild(span);
                wheelEl.appendChild(div);
            });
        }
        initWheel();

        // --- Helper Functions ---
        function switchScreen(screenName) {
            Object.values(screens).forEach(s => s.classList.remove('active'));
            screens[screenName].classList.add('active');
        }

        function showMessage(msg, color = "white", duration = 2000) {
            turnIndicator.innerHTML = `<span style="color:${color}">${msg}</span>`;
            turnIndicator.style.borderColor = color;
            turnIndicator.style.boxShadow = `0 0 15px ${color}`;
            turnIndicator.style.display = 'block';
            setTimeout(() => turnIndicator.style.display = 'none', duration);
        }

        // --- Core Turn Engine ---
        function setTurn(playerIndex) {
            currentTurn = playerIndex;
            players.forEach((p, i) => {
                p.card.classList.toggle('active-turn', i === currentTurn);
            });
            
            showMessage(`${players[currentTurn].name}'s Turn`, players[currentTurn].color);

            if (currentTurn !== 0) {
                setTimeout(() => executeSpin(currentTurn), 1500);
            }
        }

        // User Click Event
        userSpinBtn.addEventListener('click', () => {
            if(currentTurn === 0 && !isSpinning) executeSpin(0);
        });

        function executeSpin(playerIndex) {
            isSpinning = true;
            
            let p = players[playerIndex];
            let targetSegmentIndex;

            if (playerIndex === 0) {
                // USER LOGIC
                if (p.steps >= USER_MAX_LIMIT) {
                    targetSegmentIndex = Math.random() > 0.5 ? 0 : 7; // Forces 0
                } else {
                    // Random spin, but PREVENT hitting 50 (Index 4)
                    do {
                        targetSegmentIndex = Math.floor(Math.random() * segments.length);
                    } while (targetSegmentIndex === 4); 
                }
            } else {
                // CPU LOGIC
                // CPU can hit anything from Index 1 to 6 (Includes '50' at Index 4)
                targetSegmentIndex = Math.floor(Math.random() * 6) + 1; 
            }

            let resultVal = segments[targetSegmentIndex].val;
            let newSteps = p.steps + resultVal;

            if (playerIndex === 0 && newSteps > USER_MAX_LIMIT) {
                newSteps = USER_MAX_LIMIT;
            } else if (playerIndex !== 0 && newSteps >= GOAL_STEPS) {
                newSteps = GOAL_STEPS; 
            }

            // Wheel Rotation
            const targetAngle = 360 - (targetSegmentIndex * 45);
            const extraSpins = 360 * 5; 
            currentRotation += extraSpins; 
            
            const finalRotation = currentRotation + targetAngle - (currentRotation % 360);
            currentRotation = finalRotation; 

            wheelEl.style.transform = `rotate(${finalRotation}deg)`;

            setTimeout(() => {
                isSpinning = false;
                
                if (resultVal === 0) {
                    showMessage(`Oh no! ${p.name} rolled a 0.`, "#ff2a2a", 1500);
                } else if (resultVal === 50) {
                    showMessage(`JACKPOT! ${p.name} rolled 50!`, "#ffd700", 2500);
                } else {
                    showMessage(`${p.name} rolled a ${resultVal}!`, p.color, 1500);
                }
                
                p.steps = newSteps;
                p.stepTxt.textContent = p.steps;
                p.bar.style.width = `${(p.steps / GOAL_STEPS) * 100}%`;
                
                if(p.steps >= GOAL_STEPS) {
                    setTimeout(() => {
                        showMessage(`🔥 ${p.name} WINS! 🔥`, p.color, 4000);
                        setTimeout(() => switchScreen('menu'), 4000);
                    }, 1000);
                    return;
                }

                setTimeout(() => setTurn((playerIndex + 1) % 4), 2000);

            }, 3000); 
        }

        // --- Start Game Logic ---
        document.getElementById('start-game-btn').addEventListener('click', () => {
            if (walletBalance < ENTRY_FEE) {
                alert("Insufficient wallet balance! You need 75 PKR.");
                return;
            }

            let randomNames = getRandomNames(3);
            players[1].name = randomNames[0];
            players[2].name = randomNames[1];
            players[3].name = randomNames[2];

            document.getElementById('name-1').textContent = randomNames[0];
            document.getElementById('name-2').textContent = randomNames[1];
            document.getElementById('name-3').textContent = randomNames[2];

            const newBal = walletBalance - ENTRY_FEE;
            db.ref('users/' + currentUser.uid).update({ wallet_balance: newBal }).then(() => {
                players.forEach(p => { p.steps = 0; p.stepTxt.textContent = "0"; p.bar.style.width = "0%"; });
                switchScreen('game');
                setTurn(0);
            });
        });

        // --- Auth & DB Realtime Logic ---
        let isSignup = false;
        const authTitle = document.getElementById('auth-title');
        const authBtn = document.getElementById('auth-btn');
        const authError = document.getElementById('auth-error');
        const authEmail = document.getElementById('auth-email');
        const authPass = document.getElementById('auth-password');

        document.getElementById('switch-auth').addEventListener('click', (e) => {
            isSignup = !isSignup;
            authTitle.textContent = isSignup ? "Sign Up" : "Login";
            authBtn.textContent = isSignup ? "Sign Up" : "Login";
            e.target.textContent = isSignup ? "Login" : "Sign Up";
            authError.textContent = "";
        });

        authBtn.addEventListener('click', async () => {
            authError.textContent = "";
            try {
                if(isSignup) await auth.createUserWithEmailAndPassword(authEmail.value, authPass.value);
                else await auth.signInWithEmailAndPassword(authEmail.value, authPass.value);
            } catch(e) { authError.textContent = e.message; }
        });

        document.getElementById('logout-btn').addEventListener('click', () => {
            auth.signOut().then(() => profileDropdown.classList.remove('active'));
        });

        auth.onAuthStateChanged(user => {
            if (user) {
                currentUser = user;
                userEmailDisplay.textContent = user.email;
                
                db.ref('users/' + user.uid).on('value', snap => {
                    if (snap.exists() && snap.val().wallet_balance !== undefined) {
                        walletBalance = parseFloat(snap.val().wallet_balance);
                    } else {
                        walletBalance = 0; 
                        db.ref('users/' + user.uid).update({ wallet_balance: 0 });
                    }
                    // Format PKR with commas
                    walletDisplay.textContent = Math.floor(walletBalance).toLocaleString('en-IN');
                });
                
                switchScreen('menu');
            } else {
                currentUser = null;
                switchScreen('auth');
            }
        });
