/**
 * ECharts shared registry: import needed charts/components and register them.
 */
import {BarChart, HeatmapChart, LineChart, PieChart} from 'echarts/charts';
import {
	DataZoomComponent,
	GridComponent,
	LegendComponent,
	MarkAreaComponent,
	MarkLineComponent,
	PolarComponent,
	TitleComponent,
	TooltipComponent,
	VisualMapComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import {CanvasRenderer} from 'echarts/renderers';

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
	PolarComponent, // polar + angleAxis + radiusAxis for the Time-of-Day clock
	VisualMapComponent,
	CanvasRenderer,
]);

export default echarts;
