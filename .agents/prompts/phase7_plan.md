# Phase 7: Visualization Fixes
## Control Panel
### Global Filters
- Using `Time Window` to switch back to `All Time` from another option does not update the `Date Range` picker. Make it update the `Date Range` to use the `min` `max` of the Dates in the dataset.
### Timeline Controls
- When `Time Split` is set to a time interval that is smaller than that listed for `Aggregate By`, the graphs naturally do not populate. Can we dynamically filter the options in the `Time Split` drop-down to include only those time intervals which are greater than the option selected for `Aggregate By`? 
- If `Aggregate By` already has a selection that is smaller, reset it to `No Split` before filtering the options, and then display a warning, styled similarly to the infobox for Seasons ()`Seasonal Years...StartTime`) except use the `triangle-alert` for the icon, background color `#2370f1`
- Change the Seasons infobox to be background `#1dc1fa` 

## Chart Views
### Comparison View
- X-axis date labels can be extremely crowded and illegible when many dates are present. This doesn't happen on the `Timeline Controls` view when many dates are present, so there must be an eCharts option enabled to fix the date interval to allow side-by-side comparison but it's not accounting for label density. Please propose how to solve this problem based on your knowledge of echarts
- Current behavior is to have the color the default emerald for all successive time intervals added for comparison. For ease of use, please generate a sequential list of 7 colors that contrast well and auto-populate the color picker with a color for the first 7 time intervals. Allow the user to modify it, just pre-populate the color in the picker for them. After 7 time intervals, randomly select a contrasting color to the previous color.

### Distribution View
#### Day-of-Week Distribution
##### Heatmap Matrix
- In Phase 6 we attempted to fix the graph labels on the Heatmap matrix, but it doesn't appear to have worked. We need to apply a `formatter` to the `series.label` option that will do the rounding to a single decimal place for these labels. The `Show Value Labels` also doesn't toggle these off, it needs to target the `series.label.show` boolean option.

#### Temporal Grouping
- The `Temporal Grouping` input has no effect when the `Bar Chart` is selected. While the Timeline Chart can provide the same information as `Bar Chart` using the `Aggregate By`/`Split By` combination, it seems like `Temporal Grouping` should provide a simple way to see the Distributions compared over a `Temporal Grouping`. Please provide scrutiny on the following plan though as it may be duplicative of functionality elsewhere in the app and I want to deliberate before committing to adding this complexity. 

- Can we add a feature similar to `Comparison View` where `Temporal Grouping` is followed by the `Comparison Strategy` selector from `Comparison Controls` which will determine how the distributions are compared? 

- When `Period-over-Period (relative)` is selected, charts render with grouped contrasting color bars. For bar charts, dual X-axes labels: a primary label with the day of the week displayed with a margin significant enough from the bottom of the chart to display the secondary axis within, which displays the secondary x-axis labels with the specific date range labels according to the `Temporal Grouping`. For radial plots, use the dual axes label and grouped contrasting color bars as well if possible. If no such options exist, notify the user.

- When `Sequential Side-by-Side` is selected, a chart grid is produced with each graph being a `Temporal Grouping`, similar to `Split By` functioning on `Timeline View`

- Apply this `Temporal Grouping` effect across the `Time-of-Day Practice Windows` and `Activity & Preset Breakdown`