"use strict";

// Arrow ID generator

const getArrowId = (() => {
    let n = 1;
    return () => {
        return n++;
    }
})();

// Size parameters

const distance = 150;
const offsetX = 50;
const arrowSpacing = 5;
const arrowWidth = 10;
const arrowStroke = 2;
const wordSpacing = 25;
const alignmentSpace = 300;

const enLevels = [...new Set(data.map((d, i) => Math.abs(d.head - i)))].sort();
const enHighestLevel = enLevels[enLevels.length - 1];
const enOffsetY = distance / 2 * enHighestLevel;

const heLevels = [...new Set(data.map((d, i) => Math.abs(d.head - i)))].sort();
const heHighestLevel = heLevels[heLevels.length - 1];
const heOffsetY = distance / 2 * heHighestLevel;

const width = offsetX + data.length * distance;
const height = enOffsetY + 3 * wordSpacing + alignmentSpace;

// Create SVG element

const svg = d3
    .select('body')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

/****************
 * Render Words *
 ****************/

// Setup English area
const englishWordsArea = svg
    .selectAll('#english')
    .data(data)
    .enter()
    .append('text')
    .classed('english', true)
    .attr('text-anchor', 'middle')
    .attr('y', enOffsetY + wordSpacing);

/// Add words
englishWordsArea
    .append('tspan')
    .attr('x', (d, i) => offsetX + i * distance)
    .text(d => d.text);

/// Add tags 2em below words
englishWordsArea
    .append('tspan')
    .attr('x', (d, i) => offsetX + i * distance)
    .attr('dy', '2em')
    .text(d => d.tag);

// Setup Hebrew area
const hebrewWordsArea = svg
    .selectAll('#hebrew')
    .data(data)
    .enter()
    .append('text')
    .classed('hebrew', true)
    .attr('text-anchor', 'middle')
    .attr('y', height - alignmentSpace);

/// Add tags
hebrewWordsArea
    .append('tspan')
    .attr('x', (d, i) => offsetX + i * distance)
    .text(d => d.tag);

/// Add words 2em below words
hebrewWordsArea
    .append('tspan')
    .attr('x', (d, i) => offsetX + i * distance)
    .attr('dy', '2em')
    .text(d => d.text);

/*****************
 * Render Arrows *
 *****************/

const renderEnglishArrow = ({ head, deprel }, i, nodes) => {
    if (deprel === 'ROOT') {
        return;
    }

    const arrowId = getArrowId();
    const level = Math.abs(head - i);
    const start = head < i ? head : i;
    const dir = head > i ? 'left' : 'right';
    const startX = offsetX + start * distance + arrowSpacing * (enHighestLevel - level) / 4;
    const startY = enOffsetY;
    const endpoint = offsetX + level * distance + start * distance - arrowSpacing * (enHighestLevel - level) / 4;

    let curve = enOffsetY - level * distance / 2;
    if (curve === 0 && enLevels.length > 5) {
        curve = -distance;
    }

    const group = d3.select(nodes[i]);

    group
        .append('path')
        .attr('id', 'arrow-' + arrowId)
        .attr('d', `M${startX},${startY}
                    C${startX},${curve}
                     ${endpoint},${curve}
                     ${endpoint},${startY}`)
        .attr('fill', 'none')
        .attr('stroke', 'black');

    group
        .append('text')
        .attr('dy', '1em')
        .append('textPath')
        .attr('xlink:href', '#arrow-' + arrowId)
        .attr('text-anchor', 'middle')
        .attr('fill', 'black')
        .attr('startOffset', '50%')
        .text(deprel);

    group
        .append('path')
        .attr('d', `M${(dir === 'left') ? startX : endpoint},${startY + 2}
                    L${(dir === 'left') ? startX - arrowWidth + 2 : endpoint + arrowWidth - 2},${startY - arrowWidth}
                     ${(dir === 'left') ? startX + arrowWidth - 2 : endpoint - arrowWidth + 2},${startY - arrowWidth}
                    Z`)
        .attr('stroke', 'black');
};

const englishArrowsArea = svg
    .selectAll('#enArrow')
    .data(data)
    .enter()
    .append('g')
    .classed('enArrow', true)
    .each(renderEnglishArrow);

/*****************
 * Render Arrows *
 *****************/

const renderHebrewArrow = ({ head, deprel }, i, nodes) => {
    if (deprel === 'ROOT') {
        return;
    }

    const arrowId = getArrowId();
    const level = Math.abs(head - i);
    const start = head < i ? head : i;
    const dir = head > i ? 'left' : 'right';
    const startX = offsetX + start * distance + arrowSpacing * (heHighestLevel - level) / 4;
    const startY = heOffsetY;
    const endpoint = offsetX + level * distance + start * distance - arrowSpacing * (heHighestLevel - level) / 4;

    let curve = heOffsetY + wordSpacing + level * distance / 2;
    if (curve === 0 && heLevels.length > 5) {
        curve = -distance;
    }

    const group = d3.select(nodes[i]);

    group
        .append('path')
        .attr('id', 'arrow-' + arrowId)
        .attr('d', `M${startX},${startY}
                    C${startX},${curve}
                     ${endpoint},${curve}
                     ${endpoint},${startY}`)
        .attr('fill', 'none')
        .attr('stroke', 'black');

    group
        .append('text')
        .attr('dy', '1em')
        .append('textPath')
        .attr('xlink:href', '#arrow-' + arrowId)
        .attr('text-anchor', 'middle')
        .attr('fill', 'black')
        .attr('startOffset', '50%')
        .text(deprel);

    group
        .append('path')
        .attr('d', `M${(dir === 'left') ? startX : endpoint},${startY - 2}
                    L${(dir === 'left') ? startX - arrowWidth + 2 : endpoint + arrowWidth - 2},${startY + arrowWidth}
                     ${(dir === 'left') ? startX + arrowWidth - 2 : endpoint - arrowWidth + 2},${startY + arrowWidth}
                    Z`)
        .attr('stroke', 'black');
};

const hebrewArrowsArea = svg
    .selectAll('#heArrow')
    .data(data)
    .enter()
    .append('g')
    .classed('heArrow', true)
    .each(renderHebrewArrow);
