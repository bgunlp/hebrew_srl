"use strict";

// Arrow ID generator

const getArrowId = (() => {
    let n = 1;
    return () => n++;
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
    .attr('height', 2 * height);

/****************
 * Render Words *
 ****************/

const renderWords = (data, lang, y) => {
    // Setup words area
    const wordsArea = svg
        .selectAll(`#${lang}`)
        .data(data)
        .enter()
        .append('text')
        .classed(lang, true)
        .attr('text-anchor', 'middle')
        .attr('y', y);

    /// Add words
    wordsArea
        .append('tspan')
        .attr('x', (d, i) => offsetX + i * distance)
        .text(d => d.form);

    /// Add tags 2em below words
    wordsArea
        .append('tspan')
        .attr('x', (d, i) => offsetX + i * distance)
        .attr('dy', '2em')
        .text(d => d.upostag);
};

renderWords(data.english.words,'english', enOffsetY + wordSpacing);
renderWords(data.hebrew.words, 'hebrew', enOffsetY + alignmentSpace);

/*****************
 * Render Arrows *
 *****************/

const make_renderer = (lang, highestLevel, offsetY) => function ({ head, deprel }, i, nodes) {
    const direction = lang.toLowerCase() === 'english' ? -1 : 1;

    if (deprel === 'ROOT') {
        return;
    }

    const arrowId = getArrowId();
    const level = Math.abs(head - i);
    const start = head < i ? head : i;
    const dir = head > i ? 'left' : 'right';
    const startX = offsetX + start * distance + arrowSpacing * (highestLevel - level) / 4;
    const startY = offsetY;
    const endpoint = offsetX + level * distance + start * distance - arrowSpacing * (highestLevel - level) / 4;

    const group = d3.select(nodes[i]);

    group
        .append('path')
        .attr('id', 'arrow-' + arrowId)
        .attr('d', `M${startX},${startY}
                    L${startX + 10},${startY + direction * level * 40}
                     ${endpoint - 10},${startY + direction * level * 40}
                     ${endpoint},${startY}`)
        .attr('fill', 'none')
        .attr('stroke', 'black');

    group
        .append('text')
        .attr('dy', `${direction}em`)
        .append('textPath')
        .attr('xlink:href', '#arrow-' + arrowId)
        .attr('text-anchor', 'middle')
        .attr('fill', 'black')
        .attr('startOffset', '50%')
        .text(deprel);

    group
        .append('path')
        .attr('d', `M${(dir === 'left') ? startX : endpoint},${startY - direction * 2}
                    L${(dir === 'left') ? startX - arrowWidth + 2 : endpoint + arrowWidth - 2},${startY + direction * arrowWidth}
                     ${(dir === 'left') ? startX + arrowWidth - 2 : endpoint - arrowWidth + 2},${startY + direction * arrowWidth}
                    Z`)
        .attr('stroke', 'black');
};

svg
    .selectAll('#enArrow')
    .data(data.english.words)
    .enter()
    .append('g')
    .classed('enArrow', true)
    .each(make_renderer('english', enHighestLevel, enOffsetY));

svg
    .selectAll('#heArrow')
    .data(data.hebrew.words)
    .enter()
    .append('g')
    .classed('heArrow', true)
    .each(make_renderer('hebrew', heHighestLevel, enOffsetY + alignmentSpace + 2 * wordSpacing));

/********************
 * Render Alignment *
 ********************/

svg
    .selectAll('#alignment')
    .data(data.alignment)
    .enter()
    .append('line')
    .classed('alignment', true)
    .attr('x1', (d, i) => offsetX + d[0] * distance)        // Same x as words'
    .attr('y1', enOffsetY + 3 * wordSpacing)                // y coordinate of English words + 2 spacings to avoid overlap
    .attr('x2', (d, i) => offsetX + d[1] * distance)        // Same x as words'
    .attr('y2', enOffsetY + alignmentSpace - wordSpacing)   // y coordinates of Hebrew, with an overlap fix
    .attr('stroke', 'black');
