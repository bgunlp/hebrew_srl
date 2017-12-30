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
const wordSpacing = 25;
const alignmentSpace = 500;

const enLevels = [...new Set(data.english.words.map((d, i) => Math.abs(d.head - i)))].sort();
const enHighestLevel = enLevels[enLevels.length - 1];
const enOffsetY = distance * enHighestLevel;

const heLevels = [...new Set(data.hebrew.words.map((d, i) => Math.abs(d.head - i)))].sort();
const heHighestLevel = heLevels[heLevels.length - 1];
const heOffsetY = distance / 2 * heHighestLevel;

const width = offsetX + Math.max(data.english.words.length, data.hebrew.words.length) * distance;
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
    // wordsArea
    //     .append('tspan')
    //     .attr('x', (d, i) => offsetX + i * distance)
    //     .attr('dy', '2em')
    //     .text(d => d.upostag);

    return wordsArea;
};

renderWords(data.english.words,'english', enOffsetY + wordSpacing);
renderWords(data.hebrew.words, 'hebrew', enOffsetY + alignmentSpace);

/**************
 * Render SRL *
 **************/

data.english.frames.sort((a, b) => b.annotationSets[0].score - a.annotationSets[0].score);
data.hebrew.frames.sort((a, b) => b.annotationSets[0].score - a.annotationSets[0].score);

if (data.english.frames.length > 0) {
    const {target, annotationSets} = data.english.frames[0];
    const {frameElements} = annotationSets[0];

    svg
        .append('text')
        .classed('english-srl-frame', true)
        .attr('text-anchor', 'middle')
        .attr('y', enOffsetY + wordSpacing)
        .append('tspan')
        .attr('x', offsetX + target.spans[0].start * distance)
        .attr('dy', '1em')
        .text(target.name);

    frameElements.forEach(({name, spans}) => {
        const {start, end} = spans[0];
        for (let i = start; i < end; i++) {
            svg
                .append('text')
                .classed('english-srl-fe', true)
                .attr('text-anchor', 'middle')
                .attr('y', enOffsetY + wordSpacing)
                .append('tspan')
                .attr('x', offsetX + i * distance)
                .attr('dy', '2em')
                .text((i === start ? 'B' : 'I') + '-' + name);
        }
    });
}

if (data.hebrew.frames.length > 0) {
    const {target, annotationSets} = data.hebrew.frames[0];
    const {frameElements} = annotationSets[0];

    svg
        .append('text')
        .classed('hebrew-srl-frame', true)
        .attr('text-anchor', 'middle')
        .attr('y', enOffsetY + alignmentSpace)
        .append('tspan')
        .attr('x', offsetX + target.spans[0].start * distance)
        .attr('dy', '1em')
        .text(target.name);

    frameElements.forEach(({name, spans}) => {
        const {start, end} = spans[0];
        for (let i = start; i < end; i++) {
            svg
                .append('text')
                .classed('hebrew-srl-fe', true)
                .attr('text-anchor', 'middle')
                .attr('y', enOffsetY + alignmentSpace)
                .append('tspan')
                .attr('x', offsetX + i * distance)
                .attr('dy', '2em')
                .text((i === start ? 'B' : 'I') + '-' + name);
        }
    });
}


/*****************
 * Render Arrows *
 *****************/

const make_renderer = (lang, highestLevel, offsetY) => function ({ head, deprel, id }, i, nodes) {
    head = head - 1;
    id = id - 1;

    if (head < 0) {
        return;
    }

    const direction = lang.toLowerCase() === 'english' ? -1 : 1;
    const arrowId = getArrowId();
    const level = Math.abs(head - id);
    const start = head < id ? head : id;
    const dir = head > id ? 'left' : 'right';
    const startX = offsetX + start * distance + arrowSpacing * (highestLevel - level) / 4;
    const startY = offsetY;
    const endpoint = offsetX + level * distance + start * distance - arrowSpacing * (highestLevel - level) / 4;

    const group = d3.select(nodes[i]);

    group
        .append('path')
        .attr('id', 'arrow-' + arrowId)
        .attr('d', `M${startX},${startY}
                    C${startX + 20},${startY + direction * level * 50}
                     ${endpoint - 20},${startY + direction * level * 50}
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
