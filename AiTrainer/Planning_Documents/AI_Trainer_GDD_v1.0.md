# AI Trainer – Game Design Document (v1.0)

## 1. Core Concept
- **Title:** AI Trainer  
- **Genre:** Simulation / Collectible RPG / Educational  
- **Perspective:** 2.5D (3D player in 2D world, tilted view like *Hades*)  
- **Platform:** PC  
- **Audience:** Family-friendly, casual players, and tech-minded learners  
- **Goal:** Become the top AI Trainer by collecting parts, building robots, and solving problems through technology.  

## 2. Setting
- **World:** Drury Universe  
- **Focus Region:** *Industrial Drury* — synthwave-style city of labs, alleys, and tech shops.  
- **Time Cycle:** Day/night with curfew; staying out too late causes parents to confiscate part of collected loot.  
- **Shops:** Rotate random stock daily. Some are legitimate, others underground or second-hand.  

## 3. Player Progression
- **Start:** Bedroom → Garage → Co-working Space → Personal Lab.  
- **Growth:** Unlock new spaces by upgrading robots and completing milestones.  
- **Saving:** Full save at workbench; quick “micro-save” through journal or phone.  
- **Travel:** Bus, train, or upgraded bike for fast travel.  

## 4. Core Loop
1. Explore Industrial Drury to find computer parts and data packets.  
2. Battle other kids or robots in turn-based matches.  
3. Earn coins, data, and materials.  
4. Build and upgrade robots at the workbench.  
5. Progress to new zones and improve workshop.  

## 5. Resources
- **Parts:** GPUs, CPUs, RAM, motherboards, power supplies, etc.  
- **Scrap:** Combine into basic parts.  
- **Data Packets:** XP items that raise robot performance.  
- **Currencies:** Chili Coin, Chicken Coin (rare), Drury Dollars (not used by kids).  

## 6. Robot Building
- **Socket System:** Six socket types (A1–C2). Only compatible pieces connect.  
- **Parts:** Head, torso, arms, legs, back, core.  
- **Rarity:** Common → Rare → Epic → Legendary → Ultra (Green → Red → Purple → Gold → Black).  
- **Weight:** Affects what the player can carry; heavy robots limit mobility.  
- **Power Draw:** Governed by installed power supply.  
- **Styles:** Early builds look handmade; higher levels unlock polished and skinned versions.  

## 7. Robot Attributes
1. **Compute (GPU):** Attack power.  
2. **Logic (CPU):** Turn order, combo setup.  
3. **Memory:** Buff duration, cache effects.  
4. **Network:** Hacking and data drain.  
5. **I/O Systems:** Accuracy and range.  
6. **Power/Thermals:** Efficiency and overheating control.  

## 8. Battles
- **Format:** Turn-based, Pokémon-style with simple sprite animations.  
- **Moves:** Determined by installed parts.  
- **Stats:** Use computer terms (RAM, MHz, GHz) instead of HP or stamina.  
- **Results:**  
  - **Win:** Gain parts, data packets, or currency.  
  - **Lose:** Risk part breakage or data loss.  
  - **Concede:** Avoid full defeat; triggers Persistent Memory reward.  
- **Events:** Random street battles, NPC challenges, and secret tournaments hidden behind everyday activities.  

## 9. Concede & Persistent Memory
- **Purpose:** Teach that retreating is part of learning.  
- **When Used:** Player chooses to concede before total defeat.  
- **Effect:**  
  - Saves most parts from destruction.  
  - Robot earns **Persistent Memory Points (PMP)** — experience from failure.  
- **Persistent Memory Benefits:**  
  - Improves data efficiency (+1–3% from future packets).  
  - Reduces critical errors and overheating.  
  - Enhances prediction against known opponents.  
- **Limit:** PMP has a cap and slowly decays, keeping growth balanced.  

## 10. Progression & Difficulty
- **Adaptive Scaling:** Enemies match player level; distant regions have fixed minimum levels.  
- **Durability:** Parts wear out after battles and can be repaired or replaced.  
- **Quests:** Open exploration; repeatable rival battles and side events.  
- **Learning System:** Talking with NPCs or reading materials unlocks new crafting recipes.  

## 11. Economy
- **Stores:** Mainstream, underground, and random traders.  
- **Rotation:** Stock and quality change daily.  
- **Risk/Reward:** Black-market items are cheaper and stronger but less reliable.  
- **Repair Options:**  
  - **Workbench:** Low-cost, lower reliability.  
  - **Shop Repair:** Higher quality, higher cost.  

## 12. Exploration
- **Free Movement:** Player roams Industrial Drury without grid limits.  
- **Encounters:** Random map triggers, visible NPC battles, or special invitations.  
- **Capacity Limit:** Backpack weight affects movement speed.  
- **Environment:** Realistic city zones, alleys, rooftops, and tech shops.  

## 13. Robots
- **Active Robot:** One in play; others stored or swapped via “USB chip” profiles.  
- **Hero Builds:** Pre-set optimized models that act as iconic references.  
- **Custom Builds:** Fully modular; unique combinations possible.  

## 14. NPCs & Story
- **Main Character:** Tabia Newton, young inventor from Industrial Drury.  
- **Mentor:** Mr. Plow (father).  
- **Other Characters:** The Muffin Man (event host), Lost Boys, Sally & Sallie (rivals).  
- **Tone:** Light, humorous, community-driven. No violence, profanity, or dark themes.  

## 15. Game Mechanics

### Exploration
- Free movement through open zones.  
- Day/night curfew adds urgency and consequence.  
- Random encounters and social challenges.  

### Collection
- Gather parts in world or buy them from shops.  
- Scrap crafting for low-tier components.  
- Color-coded rarity defines power and price.  

### Building
- Six-socket puzzle assembly; incompatible parts reject.  
- Menu-based interface, instant functionality when fit is correct.  
- Reliability and efficiency tied to build quality.  

### Battle
- Turn-based with command selections.  
- Actions consume system resources (RAM, bandwidth, heat).  
- Rewards include coins, data, or new parts.  
- Defeat risks breakage; concede grants Persistent Memory.  

### Progression
- Data Packets raise robot stats.  
- Learning from mentors unlocks advanced builds.  
- Player’s workshop expands as skills grow.  

### Economy
- Randomized shops, limited inventory.  
- Durability and repair system adds long-term resource management.  

## 16. Art & Audio
- **Visuals:** Pixel art world, 3D player optional later.  
- **Lighting:** Bright synthwave tones.  
- **Music:** Upbeat chiptune similar to early *Pokémon*.  
- **UI:** Simple management menus inspired by *Stardew Valley*.  

## 17. Future Expansion
- Player customization.  
- Multiplayer and trading.  
- Procedural robot generation.  
- Weather and environmental effects.  
