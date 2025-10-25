# AI Trainer – Code Architecture & Systems Document (v1.0)

**Purpose:**
Defines how all code, audio, and gameplay systems must be structured for the **AI Trainer** project.
This document merges architectural logic, audio pipeline rules, and workflow protocols into one reference.
It prioritizes *modular design*, *inspector-first workflows*, and *clarity over complexity*.

---

## 1. Core Philosophy

1. **Inspector-First Design:**
   Every value affecting gameplay must be editable in the Unity Inspector. Designers should never have to modify scripts to tune the game.

2. **Modular Architecture:**
   Every system (e.g., Player, Robot, Battle, Audio, Data) must be built as a self-contained module that communicates through approved event channels. No module should directly depend on another’s implementation.

3. **Data Transparency:**
   No “magic numbers.” All tunable parameters—speed, power draw, efficiency, drop rate, etc.—must be serialized fields.

4. **Event-Driven Communication:**
   Systems never directly reference each other. They communicate through the `EventManager` (for gameplay logic) or `GameEvent` ScriptableObjects (for audio and VFX).

5. **Educational Alignment:**
   Code and UI must be written as clear, readable examples. Each subsystem (robot stats, data packets, persistent memory) should be understandable as a learning model for basic computing concepts.

---

## 2. Mandatory System Patterns

| System Category     | Approved Pattern                                 | Status    | Purpose                                                              |
| ------------------- | ------------------------------------------------ | --------- | -------------------------------------------------------------------- |
| Game Event System   | `EventManager.cs` (Event Bus)                    | MANDATORY | Handles gameplay logic events (e.g., robot status, battle outcomes). |
| Audio Event System  | `GameEvent` + `AudioRegistry` Pipeline           | MANDATORY | Routes all sound playback through AudioManager.                      |
| Object Spawning     | `ObjectPooler.cs` Singleton                      | MANDATORY | Reduces garbage collection during gameplay.                          |
| Player & Robot Data | `TrainerStats.cs` and `RobotStats.cs` Singletons | MANDATORY | Centralize XP, memory, compute, and thermal data.                    |
| Audio System        | `AudioManager.cs` + `VolumeManager.cs`           | MANDATORY | Unified audio control for music, SFX, and UI sounds.                 |
| Namespace Structure | Single-Level (no nested namespaces)              | MANDATORY | Keeps code simple and decoupled.                                     |

---

## 3. System Architecture Overview

### 3.1 Event System

* Use `EventManager.Publish()` and `EventManager.Subscribe()` for all gameplay communication.
* Use `GameEvent` ScriptableObjects for all audio and UI triggers.
* Examples:

  ```csharp
  EventManager.Publish(new RobotOverheatedEvent { ID = robotID });
  _onPlayerTrained?.Raise(); // Audio or UI trigger
  ```

### 3.2 Data Management

* `TrainerStats` holds player-level data (coins, progress, level).
* `RobotStats` manages the currently equipped robot’s performance metrics (Compute, Logic, Memory, etc.).
* All modifiers from parts, items, or data packets apply through methods in `RobotStats`.

### 3.3 Persistent Memory System

* Stored within `RobotStats` and backed up via save data.
* `PersistentMemoryPoints` accumulate on concede and improve data efficiency.
* Implement as a lightweight component so it can attach to any robot prefab.

### 3.4 Object Pooling

* All temporary VFX, projectiles, and sound prefabs must be spawned via the global `ObjectPooler`.
* No direct `Instantiate()` calls during gameplay.

---

## 4. Audio Architecture

### 4.1 Structure Overview

| Component            | Purpose                                                                  |
| -------------------- | ------------------------------------------------------------------------ |
| **MainMixer**        | Root AudioMixer asset with exposed volume controls (Master, Music, SFX). |
| **SoundFX_Prefab**   | Plays one sound, routed to SFX group.                                    |
| **AudioManager.cs**  | Centralized API for triggering sound events.                             |
| **VolumeManager.cs** | UI bridge for controlling mixer levels.                                  |

### 4.2 Enum-Driven Design

* Create an enum `Sound` (Jump, Click, Victory, Concede, etc.).
* `AudioManager` exposes `PlaySound(Sound soundType, Vector3 position)` to all scripts.
* Each sound entry in the enum automatically maps to a corresponding `SoundAudioClip` struct in the Inspector.

### 4.3 Volume Conversion Formula

All volume sliders use logarithmic conversion:
`Mathf.Log10(level) * 20`

### 4.4 Audio Event Flow

```
Gameplay Trigger → GameEvent (ScriptableObject) → AudioRegistry → AudioManager.PlaySound() → SoundFX Prefab → Mixer
```

This separation ensures that:

* Designers can swap audio clips freely.
* Programmers never hard-code sound logic.
* The system remains modular for future expansion (e.g., voice, environment reverb).

---

## 5. Code & Naming Standards

| Type             | Format       | Example                    |
| ---------------- | ------------ | -------------------------- |
| Public Variable  | PascalCase   | `public float RunSpeed;`   |
| Private Variable | _camelCase   | `private float _runSpeed;` |
| Method           | PascalCase   | `void HandleInput()`       |
| Script/Class     | PascalCase   | `RobotStats.cs`            |
| Namespace        | Single Level | `namespace Robots { }`     |

* **Comment the “why,” not the “what.”**
* **No nested namespaces.**
* **No abbreviations or unclear variable names.**

---

## 6. Workflow & Change Protocol

1. **Registry Check:**
   Confirm if a mandatory pattern already exists before writing any code.

2. **Proposal Protocol:**
   If a new system or refactor is needed, document:

   * Problem
   * Proposed Solution
   * Impact
     No implementation before approval.

3. **Branching Rules (Git):**

   * `main` = stable.
   * Work on feature branches (e.g., `feature/persistent-memory`).
   * Commit messages: `Feat: Implement Persistent Memory gain on concede`.

4. **Debugging Hierarchy:**

   * Step 1: Isolate the smallest version of the problem.
   * Step 2: Check Inspector references.
   * Step 3: Consult official Unity documentation or verified tutorials.
   * Step 4: Test live values in Play Mode.
   * Step 5: Apply minimal targeted fix.

5. **Primacy of Observation Protocol:**
   The project owner’s real-time observation overrides analytical debugging. Their stated “Ground Truth” becomes the factual baseline for new hypotheses.

---

## 7. Module Map (Initial)

| Module         | Core Classes                                     | Description                                         |
| -------------- | ------------------------------------------------ | --------------------------------------------------- |
| Trainer System | `TrainerStats`, `TrainerInventory`               | Manages player data, items, and progression.        |
| Robot System   | `RobotStats`, `RobotBuilder`, `PersistentMemory` | Handles modular robot builds and memory bonuses.    |
| Battle System  | `BattleManager`, `TurnHandler`, `MoveExecutor`   | Manages turn-based battles and outcomes.            |
| Economy        | `ShopSystem`, `ItemData`, `CurrencyManager`      | Handles stores, loot tables, and currency.          |
| Audio          | `AudioManager`, `VolumeManager`, `AudioRegistry` | Handles all sound playback and UI audio.            |
| Event System   | `EventManager`, `GameEvent`                      | Core message bus for communication between modules. |

---

## 8. Anti-Patterns (Do Not Use)

1. **Hard References:**
   Never link systems directly via component references. Use events.

2. **Magic Numbers:**
   No literal values like `if (xp > 100)`; must be serialized fields.

3. **“Smart” Controllers:**
   Keep each script’s logic within its defined domain (e.g., `BattleManager` doesn’t handle audio).

4. **Custom Audio Sources:**
   Do not play sounds directly from scripts or prefabs. Use AudioManager only.

5. **Namespace Nesting:**
   Keep all namespaces one level deep.

---

## 9. Future Extensions

* Multiplayer event layer (same event bus logic, networked version).
* AI simulation module for independent robot behavior learning.
* Visual scripting hooks for designer-only experimentation.
* Data export/import system for school or training purposes.
