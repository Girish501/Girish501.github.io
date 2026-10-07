# Site content for girisharora.com

Source: Girish Arora's resume, October 2026. Use this file as the single source of truth for site text. Do not invent facts.

Revision 2 (Oct 2026): added the PLL and FPGA flight controller projects (from Girish's GitHub repos), device descriptions for NeuroSense and NeuroBand (from the Elektor and Circuit Digest contest pages), the availability line, and rewritten Experience prose. Removed coursework, the resume download, the Awards section, and the separate Contact page.

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

**p-Chip prose:** I worked on the transmitter side of a laser reader for RF microtransponders. I designed and tested a scanning-mirror drive subsystem that extended the reader's working distance, and validated it on the bench with photodiode timing measurements.

**Addverb prose:** I built motor-drive hardware and firmware for Zippy warehouse robots. I designed a BLDC motor driver board, wrote STM32 firmware for its current-sense amplifier with moving-average filtering, and integrated an R320M Wi-Fi 6 SOM as a TCP server on the robots.

**Detkin Lab prose:** I help students in Penn's embedded and circuit labs with instruments and components, and troubleshoot measurement, equipment, and circuit problems. I also run lab procurement: I maintain the inventory tracker and source parts from DigiKey, McMaster-Carr, and Amazon.

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

Order on the site: TIA, PLL, SRAM, Cleanroom fabrication, Power device characterization, Compute-in-memory, NeuroSense, NeuroBand, FPGA flight controller.
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
- **Global 3rd place**, Elektor-STM32 Edge-AI Competition 2025. 423+ entries from 31+ countries. €1,000 prize. Team of three.

### NeuroBand
2025. Wearable.
- Safety armband for elderly and high-risk users. It detects falls and tracks heart rate and ECG. On a fall it sounds an SOS alarm and sends a Wi-Fi alert to a caregiver app with the ECG recorded just before the event.
- Hardware: ESP32-S3 running an on-device fall classifier on accelerometer and gyroscope data, plus heart-rate and ECG sensors.
- **Top 10 of 2,959**, Circuit Digest Smart Home and Wearables Project Contest 2025. (Check: Circuit Digest reports 889 submissions from 2,959 participants.)

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

## Blog

Start with an empty blog section and a simple way to add posts as Markdown files. Hide the Blog nav link until a post exists. Suggested first post topics (do not write these, just leave placeholders): fitting AZO ellipsometry data in WVASE, lessons from a first 45 nm TIA tape-out-style design, what 60 hours in a cleanroom teaches you.

## Contact

A compact block at the bottom of the home page: email, LinkedIn, GitHub. No separate Contact page, no resume download, no contact form, no phone number.
