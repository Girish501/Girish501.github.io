# Site content for girisharora.com

Source: Girish Arora's resume, October 2026. Use this file as the single source of truth for site text. Do not invent facts.

Revision 3 (Nov 2026): redesign. Light paper page, Instrument Serif and Instrument Sans, one blue accent. Hero statement and section copy below. Projects shown as a list led by each project's number, in three groups. Awards folded into project rows; press under "Elsewhere"; contact as the closing band.

Revision 2 (Oct 2026): added the PLL and FPGA flight controller projects (from Girish's GitHub repos), device descriptions for NeuroSense and NeuroBand (from the Elektor and Circuit Digest contest pages), the availability line, and rewritten Experience prose. Removed coursework, the resume download, the Awards section, and the separate Contact page.

## Revision 4 (Nov 2026): positioning and copy

Positioning: fab process, integration and equipment roles first; analog/RF design second. The AZO work leads; circuits come second.

### Hero point cloud (revision 5, Nov 2026; shapes redrawn in revision 6; TIA shapes moved to Circuits in revision 8)
On desktop the hero pins and a point cloud morphs through shapes built from the site's numbers, with a panel per shape:
- 1 of 2: wurtzite ZnO unit cell, ball and stick (hexagonal prism, Zn dark, O blue, bonds gray). Labels on the shape: Zn, O, "a 3.252 Å", "c 5.213 Å". Panel: 3.252 Å, "lattice constant a, single-phase wurtzite ZnO, XRD", link Process work.
- 2 of 2: the 600-cycle film in cross-section on its substrate, a blue plane per Al cycle at 19:1, thickness bracket. Labels on the shape: "85 to 88 nm", "ZnO:Al", "Al cycle", "Si / glass". Panel: 85 to 88 nm, "thickness, all films, 600 cycles, 19:1 ZnO:Al shown".
- (Tauc curves join as a third shape once data/azo/tauc_*.csv exist. Panel: +0.23 eV, "optical band edge, 99:1 to 19:1".)
- The diode and MOSFET I-V shape was removed in revision 7 at Girish's request.

### TIA case in Circuits (revision 8, Nov 2026)
The TIA row became a pinned case like the AZO one: three steps on the left, the point cloud on the right, from the ESE 5720 report. Step copy (confirm or replace):
- Signal chain. 109 dBΩ, "transimpedance gain, 282 kΩ". The existing row sentence, then: Photodiode model: a current source with 100 fF, 50 pF coupling. Common-gate input stage. Differential amplifier with active loads. Four cascaded common-source gain stages. Source-follower buffer into a 600 Ω load.
- Output. 594 mV, "differential output swing, peak to peak". "Transient simulation: 2.67 µA peak to peak at 300 MHz in, 594 mV peak to peak across VOP and VON out."
- Frequency response. 492 MHz, "upper −3 dB corner". "Gain flat at 109 dBΩ from 2.31 MHz to 492.88 MHz, from the Spectre AC sweep of VOP minus VON over the photodiode current."
Shapes: the signal chain schematic (labels Photodiode, 100 fF, Common gate, Differential pair, Four common-source stages, Source follower, 1 V, VOP, VON, 600 Ω) with blue pulses on both paths; current in and voltage out against time, 20 ns, the sines travel; gain against frequency digitized from the report plot, 100 kHz to 10 GHz, the 104.7 dB line with dots at 2.31 MHz and 492.88 MHz. Static fallbacks (3x renders of the three shapes), titles to confirm: "45 nm CMOS TIA. Signal chain.", "45 nm CMOS TIA. Transient simulation, 300 MHz.", "45 nm CMOS TIA. Spectre simulation, 1 V supply." Both stages pin from 700 px of viewport height; under 820 px the AZO results table is compact and the ALD figure scales down (revision 8). Lattice colours back to Zn dark, O gray (revision 8).
Phones, reduced motion, and software GPUs keep the static hero figure.

### Hero
- Statement: I develop thin-film processes at Penn's nanofab and design analog circuits.
- Sub text: MSE Electrical Engineering, University of Pennsylvania, May 2027. Graduate Student Fellow at the Quattrone Nanofabrication Facility, developing aluminum-doped zinc oxide by ALD and sputtering as an indium-free ITO replacement.
- Facts line: Open to process, integration and equipment engineering, and analog/RF design roles, 2027 · Will relocate anywhere in the US
- Figure: AZO Tauc plots from data/azo/tauc_<ratio>.csv once they exist (one curve per Al ratio, drawn 99:1 to 9:1, then a marker from 3.35 to 3.58 eV labeled +0.23 eV; 29:1 dashed with a footnote if off-trend). Until then, the TIA figure. Never placeholder curves. Every axis gets a label with units.

### Section order
Process work, Circuits, Hardware and power, Experience, Tools, About, Contact.

### Process work: AZO case study
- Title: Aluminum-doped zinc oxide by ALD and sputtering
- Intro: I am developing aluminum-doped zinc oxide (AZO) by ALD and sputtering as an indium-free ITO replacement. I grow ZnO:Al films on a Cambridge NanoTech Savannah S200 ALD tool, fit each film's optical response with spectroscopic ellipsometry in WVASE, and use XRD and my own Python analysis to tie doping level to film properties.
- Process: Starting Al levels from a literature survey of ALD AZO. Five-ratio series at 200 °C (99:1, 49:1, 29:1, 19:1, 9:1 ZnO:Al supercycles, 600 cycles, DEZ/TMA/H2O) on Si and glass. WVASE fit: Cauchy, then point-by-point n,k, then a PSemi-M0 oscillator with a free-carrier term and a roughness layer. Symmetric and grazing-incidence XRD on a Rigaku SmartLab. Python tools for n,k overlays, Tauc plots, XRD peak fitting (pseudo-Voigt, Scherrer grain size) and a one-page report per sample.
- Results (Parameter | Condition | Value):
  Thickness | all films, 600 cycles | 85 to 88 nm
  Roughness | ellipsometry fit | 1.3 to 1.5 nm
  Fit quality | all films | MSE below 7
  Optical band edge | 99:1 to 19:1 | 3.35 to 3.58 eV (+0.23 eV)
  Optical carrier density | 19:1 | about 7 × 10^19 cm^-3
  Phase | XRD, all films | single-phase wurtzite ZnO, strong (100) texture
  Lattice constant a | with increasing Al | 3.252 to 3.243 Å
  Lattice constant c | with increasing Al | 5.213 to 5.190 Å
  Sheet resistance | 19:1 on glass, four-point probe, one spot | 1155 Ω/sq
  Resistivity | 19:1 | about 1 × 10^-2 Ω·cm
  (Mobility left out until confirmed.)
- Excursion: The 29:1 run came out off-trend. Re-mounting the sample brought back the missing XRD peaks. A run-log comparison showed one heater zone 19 °C below setpoint.
- Sputtering, in progress: Co-sputtering AZO on a Kurt J. Lesker PVD-03 (ZnO on RF, Al on DC, 100% O2). Calibrating each gun alone before a DOE against the ALD series.
- Tools: Cambridge NanoTech Savannah S200 ALD (qualified for 24/7 independent use, precursor changes). PVD-03 (sputter target changes).
- Then ESE 5360 device fabrication, led by 23 nm (DSA feature height).

### ALD supercycle figure (in the case study)
Title: the process line, verbatim. Left: one cycle, rows DEZ, TMA, H2O, N2 purge, with the recipe times under the blocks (DEZ 0.02 s, N2 purge 10 s, H2O 0.015 s, N2 purge 10 s; TMA 0.02 s). Substrate line: Si / glass · 200 °C · N2 carrier 20 sccm. From the Savannah recipe screen (200C_AZO_LB.txt); status lines "ZnO cycle k of N", "Al cycle", "supercycle k of S". Right: film on "Si / glass · 200 °C", a blue line per Al cycle, counter to "600 cycles · 85 to 88 nm". Ratio buttons 99:1 to 9:1 and Replay.

### Circuits
TIA (109 dBΩ lead, static plot), PLL, SRAM, compute-in-memory.

### Hardware and power
ESE 5800 power device characterization, then NeuroSense, NeuroBand and the FPGA quadcopter as a compact list with no big lead numbers. Awards in plain text.

### Experience
QNF shortened to two lines that link to the case study. "Cambridge NanoTech Savannah S200" everywhere.

### Tools
Split into "Qualified for independent use" (so far: Savannah S200 only) and "Used in research and coursework".

### Contact band
Graduating May 2027. Open to process, integration and equipment engineering, and analog/RF design roles, 2027. Will relocate anywhere in the US.

### Look
Instrument Sans for everything, headings at 600, tabular numerals on every number. Paper background and one blue. Writing page unlinked and noindex until the first post.

## Identity

- Name: Girish Arora
- Title line: MSE Electrical Engineering, University of Pennsylvania (May 2027)
- Focus: Analog and mixed-signal IC design, nanofabrication, power electronics
- Location: Philadelphia, PA (footer only)
- Availability line (hero): Open to analog/mixed-signal roles, 2027
- Email: girish5@engineering.upenn.edu
- LinkedIn: linkedin.com/in/girish-arora-027918226
- GitHub: github.com/Girish501
- Do not publish phone number or street address anywhere on the site.
- No resume download on the site. The resume PDF contains a phone number and detailed p-Chip work.

## Hero (revision 3)

- Statement (h1): I design analog circuits, and grow the thin films they are built on.
- Lead: MSE Electrical Engineering at the University of Pennsylvania, graduating May 2027. Graduate Student Fellow at Penn's Quattrone Nanofabrication Facility, where I am developing an ALD process for aluminum-doped zinc oxide.
- Facts line: Open to analog and mixed-signal roles, 2027 · Philadelphia, PA
- Buttons: See the work · Email me
- Figure: transimpedance gain of the 45 nm TIA (Spectre, 1 V): flat at 109 dBΩ, −3 dB at 492 MHz. Drawn in ink once on load.

## Closing band (revision 3)

- Heading: Graduating May 2027.
- Line: Open to analog and mixed-signal design roles. Email is the fastest way to reach me.
- Email, LinkedIn, GitHub. Footer: © year Girish Arora · Philadelphia, PA.

## One-line summary

Analog and mixed-signal IC designer with hands-on cleanroom and thin-film process experience. Currently a Graduate Student Fellow at Penn's Quattrone Nanofabrication Facility.
(Not shown in the hero since revision 2. The hero shows name, title line, focus line, and availability line.)

## Education

**University of Pennsylvania, School of Engineering and Applied Science** (Philadelphia, PA)
Master of Science in Engineering, Electrical Engineering. Aug 2025 to May 2027.

**Thapar Institute of Engineering and Technology** (Patiala, India)
Bachelor of Engineering, Electronics and Communication. Sep 2021 to Jun 2025. GPA 3.89/4.0.
Merit-III Scholarship, 2nd and 3rd year, top 10% of class.

## Experience

Site format: one short paragraph per role, then at most 3 bullets with key numbers. Facts below the prose are the source.

**QNF prose:** I am developing an atomic layer deposition (ALD) process for aluminum-doped zinc oxide (AZO) as a replacement for ITO. I grow ZnO:Al films on a Cambridge S200 ALD tool, fit each film's optical response with spectroscopic ellipsometry in WVASE, and use XRD and my own Python analysis to tie doping level to film properties.
- 200 °C doping series from DEZ, TMA, and H2O at 99:1, 49:1, and 19:1 ZnO:Al cycle ratios.
- Ellipsometry fits give 85 to 88 nm film thickness at fit MSE below 7.
- 0.2 eV Burstein-Moss band-edge shift (3.35 to 3.58 eV) and free-carrier absorption at 19:1, consistent with literature.
- Image slot: "AZO films on the ellipsometer stage" (photo to come).

**p-Chip prose (matches the Penn ESE post):** I worked on a mirror driver board for p-Chip's laser reader. An oscillating mirror sweeps the beam to extend the reader's working distance. The mirror is a resonant load, so the drive circuit has to hold a clean sine at resonance with stable amplitude and phase. I took it from the first scope measurement to a design ready to build.
- Link at the end: https://blog.ese.upenn.edu/ee-masters-student-girish-arora-reflects-on-his-summer-internship-at-p-chip-corporation/
- No part numbers or schematic detail.

**Addverb prose:** I built motor-drive hardware and firmware for Zippy warehouse robots. I designed a BLDC motor driver board, wrote STM32 firmware for its current-sense amplifier with moving-average filtering, and integrated an R320M Wi-Fi 6 SOM as a TCP server on the robots.

**Detkin Lab prose:** I help students in Penn's embedded and circuit labs with instruments and components, and troubleshoot measurement, equipment, and circuit problems. I also run lab procurement: I maintain the inventory tracker and source parts from DigiKey, McMaster-Carr, and Amazon.
- Two YouTube videos side by side: QTJ8fXF8_7o (power supply) and JHV8bR9OWwg (mixed-signal oscilloscope). Caption: "Instrument tutorials I made for the lab: power supply and mixed-signal oscilloscope."

## Press and mentions

Compact block after Experience.
- "EE Master's student Girish Arora reflects on his summer internship at p-Chip Corporation." Penn ESE Department News, Oct 12, 2026. https://blog.ese.upenn.edu/ee-masters-student-girish-arora-reflects-on-his-summer-internship-at-p-chip-corporation/
- "Graduate Student Leader, Detkin Lab team page." https://detkin.ese.upenn.edu/team-leadership/
- "NeuroSense selected as a finalist, STM32 Edge AI Contest 2025." eeNews Europe, Oct 31, 2025. https://www.eenewseurope.com/en/stm32-edge-ai-contest-2025

### Quattrone Nanofabrication Facility (QNF), Penn. Graduate Student Fellow. Sep 2026 to present.
- Developing an ALD process for aluminum-doped zinc oxide (AZO) as an ITO replacement.
- Grew a 200 °C DEZ/TMA/H2O doping series (99:1, 49:1, 19:1 ZnO:Al cycle ratios) on a Cambridge S200 ALD tool.
- Built a spectroscopic ellipsometry fitting workflow in WVASE (Cauchy, point-by-point n,k, PSemi-M0 oscillator with a free-carrier term). Extracted thickness (85 to 88 nm), refractive index, and band edge for each film at fit MSE below 7.
- Correlated doping ratio with film properties: a 0.2 eV Burstein-Moss band-edge shift (3.35 to 3.58 eV) and free-carrier absorption at 19:1, consistent with literature.
- Trained on Rigaku SmartLab XRD. Wrote Python scripts for n,k overlays, Tauc band-gap analysis, and doping-trend plots.

### p-Chip Corporation, Philadelphia. Hardware Development Intern. Jun 2026 to Aug 2026.
Keep this entry high level on the site. Do not describe board layout, firmware, or circuit specifics.
- Hardware development on the transmitter side of a laser reader for RF microtransponders.
- Designed and tested a scanning-mirror drive subsystem that extended the reader's working distance.
- Bench validation with photodiode timing measurements.

### Addverb Technologies, India. Embedded Systems Intern. Jan 2025 to Jul 2025.
- Designed a BLDC motor driver board.
- Wrote STM32 firmware for a current-sense amplifier with moving-average filtering.
- Integrated an R320M Wi-Fi 6 SOM as a TCP server on Zippy warehouse robots.

### Detkin Lab, Penn ESE. ESE Lab Leader. Jan 2026 to present.
- Guide students on instrumentation and components. Troubleshoot measurement, equipment, and circuit issues in embedded and circuit labs.
- Run lab procurement: maintain the inventory tracker and source parts from DigiKey, McMaster-Carr, and Amazon.

## Projects

Order on the site (revision 3), as a list in three groups, each row led by its number:
- Circuits: TIA (109 dBΩ), PLL (4.44 GHz), SRAM (33 µW).
- Devices and fabrication: AZO by ALD (85 to 88 nm; from the QNF work), Cleanroom fabrication (60 hours), Power device characterization (65.1 mΩ).
- Systems: Compute-in-memory (11% lower EDP), NeuroSense (3rd of 423+), NeuroBand (Top 10 of 2,959), FPGA flight controller (4 motors).
Each card has one image slot and one headline metric (marked **bold** below). Link a card to its GitHub repo where one exists.

### Wideband Transimpedance Amplifier in 45 nm CMOS
Aug 2025 to Dec 2025. Analog IC design.
- 1 V CMOS TIA for photodiode front ends.
- **109 dBΩ** transimpedance gain, ~492 MHz bandwidth, ~4.5e-14 A²/Hz input-referred noise, 2.76 mW power.
- Tools: Cadence Virtuoso, Spectre.

### Phase-Locked Loop for SerDes Clock Generation in 180 nm CMOS
Undergraduate capstone, Thapar. 2024. Analog/mixed-signal IC design.
Repo: https://github.com/Girish501/Phase-Locked-Loop-for-Clock-Generation-in-SerDes-in-180nm-CMOS
- Charge-pump PLL for SerDes clocking: phase-frequency detector, charge pump with loop filter, 3-stage ring VCO, and frequency divider.
- **4.44 GHz** output at 1.8 V supply with 50% duty cycle, from transient simulation (typical corner, 25 °C).
- Team of four. Tools: Cadence Virtuoso, Spectre.

### 16×4 SRAM Memory Circuit
Sep 2025 to Dec 2025. Memory circuit design.
- Read access delay 3.348 ps.
- Cut power from 131 µW at 1.2 V to **33 µW at 1.0 V** through supply-voltage scaling.

### Cleanroom Device Fabrication (ESE 5360)
Jan 2026 to May 2026. Nanofabrication.
- **60 hours** of hands-on cleanroom work: photolithography, EBL, RIE/DRIE plasma etch, PECVD and sputtered thin films, ALD, wet processing, device release.
- Fabricated MEMS actuators on SOI. Verified the 2.6 µm device layer by reflectometry.
- Patterned PS-b-PMMA by directed self-assembly with 23 nm feature heights.
- Also worked on graphene transistors and CdSe quantum dot synthesis.

### Power Device Characterization (ESE 5800)
Sep 2026 to present. Power electronics.
- Characterized an STPS360AF Schottky diode and an IRLML0040 MOSFET from 0.02 to 4 A with pulsed bench measurements.
- Automated the measurements in Python/PyVISA on Keysight E36441A and 34461A instruments.
- Fit simplified models (VFWD = 0.330 V, RON = 66.5 mΩ, **RDS(on) = 65.1 mΩ**) and validated them against vendor SPICE models and datasheet curves.

### Robust Compute-in-Memory for Edge Healthcare (ESE 5760)
Jan 2026 to May 2026. Semiconductor memory.
- Modeled OxRAM and PCM 2T2R crossbar non-idealities (RTN, conductance drift) inside hardware-aware training of a 1D-CNN ECG classifier.
- PCM showed **11% lower** energy-delay product (0.0275 µJ per inference).

### NeuroSense
2025. Edge AI hardware.
- Real-time mental health monitor that runs entirely on the device. It combines facial emotion recognition, speech cues, and EEG to detect stress, anxiety, and other emotional states.
- Hardware: STM32N6570-DK with its built-in NPU, an EEG front end with instrumentation amplifier and filtering, a YOLOv8-based emotion model, and a TouchGFX touchscreen UI.
- **Global 3rd place**, Elektor-STM32 Edge-AI Competition 2025. 423+ entries from 31+ countries. €1,000 prize.
- Credit line: With Kartik Khandelwal and Viren Sharma.
- Media: YouTube video n8w2AGcf5HU (start time to be set).
- Links: "Project page on Elektor Labs" https://www.elektormagazine.com/labs/neurosense-real-time-mental-health-monitoring-system-on-stm32n6 and "Nominee announcement" https://www.eenewseurope.com/en/stm32-edge-ai-contest-2025

### NeuroBand
2025. Wearable.
- Safety armband for elderly and high-risk users. It detects falls and tracks heart rate and ECG. On a fall it sounds an SOS alarm and sends a Wi-Fi alert to a caregiver app with the ECG recorded just before the event.
- Hardware: ESP32-S3 running an on-device fall classifier on accelerometer and gyroscope data, plus heart-rate and ECG sensors.
- **Top 10 of 2,959**, Circuit Digest Smart Home and Wearables Project Contest 2025. (Check: Circuit Digest reports 889 submissions from 2,959 participants.)
- Credit line: With Kartik Khandelwal.
- Media: YouTube video 41hNWNWDTYc.
- Link: "Project page on Circuit Digest" https://circuitdigest.com/microcontroller-projects/neuroband-the-smart-safety-band

### FPGA Flight Controller for a Quadcopter
Thapar, team project. 2024. Digital design / FPGA.
Repo: https://github.com/Girish501/FPGA-Drone
- Quadcopter flight controller written in HDL on a Basys-3 (Artix-7) FPGA instead of a microcontroller.
- Modules: PWM decoders for throttle, yaw, pitch, and roll from the RC receiver, an I2C master for the MPU-6050 IMU, a PID controller, and a PWM encoder driving the ESCs.
- My part: interfacing the peripherals with the FPGA, the FPV camera, and the PWM encoder and decoder HDL. **All four motors** synchronized with the transmitter and receiver. Tools: Xilinx Vivado.

## Skills

- Fab and process: Photolithography, EBL (Raith EBPG), ALD, sputtering (PVD), PECVD, RIE/DRIE, wet processing, device release
- Metrology and characterization: SEM, AFM, spectroscopic ellipsometry (WVASE), XRD, reflectometry, profilometry, white-light interferometry, pulsed I-V (PyVISA)
- Design and simulation: Cadence Virtuoso, Spectre, LTspice, NVSim, NeuroSim, Tanner, Xilinx Vivado, Mentor PADS, KiCad
- Test and debug: Oscilloscope (differential and current probes), logic analyzer, spectrum analyzer, signal generator, DMM, LCR meter
- Programming: Python (data analysis, PyVISA instrument automation, PyTorch), MATLAB, C, Verilog

## Awards

No separate section on the site since revision 2. Contest awards appear in the NeuroSense and NeuroBand cards. The Merit-III Scholarship appears in Education.

## About section (longer bio)

I am an MSE Electrical Engineering student at the University of Pennsylvania, graduating May 2027. My work sits between analog IC design and the fab. I design circuits in Cadence (a 45 nm TIA, an SRAM array) and I also grow and characterize the films those circuits depend on. At Penn's Quattrone Nanofabrication Facility I am developing an ALD process for aluminum-doped zinc oxide as a replacement for ITO. Before Penn I did a B.E. in Electronics and Communication at Thapar in India and spent a summer building motor driver hardware and firmware for warehouse robots.

Long term, I want to work on analog and mixed-signal silicon in the US and then build a semiconductor manufacturing business in India.

Photo next to the bio: cleanroom gown photo.

## Animations (numbers they show)

- Hero: ALD cycle (DEZ pulse, N2 purge, H2O pulse, N2 purge), one monolayer per cycle, thickness counter to 85 nm.
- TIA card: Bode plot, flat at 109 dBΩ, -3 dB at 492 MHz.
- PLL card: reference and VCO square waves locking, frequency settling at 4.44 GHz.
- SRAM card: 6T cell read, read access 3.348 ps.
- Power device card: diode and MOSFET I-V from 0.02 to 4 A, VFWD = 0.330 V, RDS(on) = 65.1 mΩ.
- QNF entry: ellipsometer beam on the film; band edge 3.35 to 3.58 eV as doping steps 99:1, 49:1, 19:1.
- p-Chip entry: sine drive, mirror at resonance, beam sweeping a row of targets. Abstract only.
- FPGA card: static block diagram.

## Blog

Start with an empty blog section and a simple way to add posts as Markdown files. Hide the Blog nav link until a post exists. Suggested first post topics (do not write these, just leave placeholders): fitting AZO ellipsometry data in WVASE, lessons from a first 45 nm TIA tape-out-style design, what 60 hours in a cleanroom teaches you.

## Contact

A compact block at the bottom of the home page: email, LinkedIn, GitHub. No separate Contact page, no resume download, no contact form, no phone number.
