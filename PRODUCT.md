# Product

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
React, TypeScript, Vite, Tailwind CSS, Recharts, D3, PapaParse, Lucide React. Specified in the user's brief.

## Users and Purpose
Dashboard for a Data Visualization course project: understand priority areas for stunting intervention in Central Java through prevalence, historical changes, distance from the historical 14% target, and municipality versus regency comparisons.

## Capabilities and Constraints
Use only the supplied CSV (2019, 2021, 2022; 35 areas each) and supplied GeoJSON. Calculate indicators locally, distinguish areas by code, never interpolate missing 2020 data. Filters, actual geographic boundaries, sorting, search, selection, zoom, trends, and export must work. No backend is needed.

## Brand Commitments
The supplied dashboard image governs the composition: light background, four pastel scorecards, large choropleth left, comparison and ranking right. Indonesian interface. Preserve threshold colors and readable labels. Add trends below the main overview.

## Evidence on Hand
User-provided prevalence CSV, boundaries GeoJSON and reference PNG from Downloads. No upstream provenance or license is supplied for the boundaries; do not invent either.

## Product Principles
Accuracy before presentation. Overview, filter, then details. Comparisons in view. Values and text supplement colors. Simple area means are not population-weighted estimates.
