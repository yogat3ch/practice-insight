/**
 * ECharts shared registry: import needed charts/components and register them.
 */
import { BarChart, HeatmapChart, LineChart, PieChart } from 'echarts/charts';
import {
	DataZoomComponent,
	GridComponent,
	LegendComponent,
	MarkAreaComponent,
	MarkLineComponent,
	TitleComponent,
	TooltipComponent,
	VisualMapComponent
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';

// Register required modules once
echarts.use([
	LineChart,
	BarChart,
	PieChart,
	HeatmapChart,
	GridComponent,
	TooltipComponent,
	DataZoomComponent,
	TitleComponent,
	LegendComponent,
	MarkLineComponent,
	MarkAreaComponent,
	VisualMapComponent,
	CanvasRenderer
]);

export default echarts;
