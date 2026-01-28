# EzLogView

（我不会写前端，所以整个项目就是vibe coding出来的。不要对可用性保有期望！）

**EzLogView** is a modern, high-performance log viewer designed to help developers and system administrators visualize and analyze large log files efficiently. Built with performance in mind, it leverages virtualization to handle huge datasets smoothly, coupled with an interactive timeline for intuitive navigation.

![EzLogView Banner](https://placeholder-image-url-if-any.com)

## ✨ Key Features

- **High Performance Rendering**: Utilizes `react-virtuoso` to render lists with thousands or even millions of log lines without performance degradation.
- **Interactive Timeline**: Visualizes log frequency and error distribution over time using Apache ECharts. 
- **Time-based Navigation**: Click on the timeline to instantly scroll to and highlight logs from a specific time range.
- **Smart Filtering**: Visual dimming of logs outside the selected time window helps focus on relevant events.
- **Split View Layout**: Adjustable split panes between the log console and timeline for a customizable workspace.
- **Broad File Support**: Supports drag-and-drop for `.log`, `.txt`, `.csv`, and other text-based log files.
- **Modern UI**: A dark-themed, clean interface built with Tailwind CSS for a comfortable viewing experience.

## 🛠 Tech Stack

- **Frontend Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Visualization**: [Apache ECharts](https://echarts.apache.org/)
- **Virtualization**: [React Virtuoso](https://virtuoso.dev/)
- **UI Components**: [React Resizable Panels](https://github.com/bvaughn/react-resizable-panels), [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ezlogview.git
   cd ezlogview
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

Start the development server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173` (or the URL shown in the terminal).

### Building for Production

To build the application for production:
```bash
npm run build
```
This will compile the project into the `dist` directory. You can verify the build locally with:
```bash
npm run preview
```

## 📖 Usage

1. **Upload a File**: Drag and drop a log file onto the main window, or click the upload area to select a file from your computer.
2. **Explore Logs**: Scroll through the list like a standard console.
3. **Use the Timeline**:
   - The bottom chart shows the volume of logs over time.
   - **Click** on a bar or region in the timeline to focus the log view on that specific time period.
   - The log list will automatically scroll to the first log of that period, and logs outside the range will be visually dimmed.
4. **Close File**: Click the "Close File" button in the header to reset and upload a new log.

## 📄 License

[MIT](LICENSE)

---

**EzLogView** — Making log analysis easy and efficient.
