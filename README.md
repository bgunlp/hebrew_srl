# Building a Hebrew FrameNet Lexical Resource from Parallel Movie Subtitles

This work sets out to acquire Hebrew exemplar sentences with FrameNet annotations by projecting annotations from English. To this end, we use the [OpenSubtitles 2016](http://opus.nlpl.eu/OpenSubtitles2016.php) dataset of aligned English-Hebrew subtitles of movies and television shows.

This repository contains the following:

* Thesis in PDF format
* Source code for the SRL visualization tool
* Jupyter notebooks for dataset construction, dataset statistics, and feature extraction
* Two sqlite databases: `manual_annotations.sqlite3` (original seed) and `data.sqlite3` (result of classifier annotation on a subset of the dataset)
* The code for the classifier, and a pickled trained classifier

A link to the entire post-processed dataset will be added soon.

The following diagram shows the end-to-end flow of data:

![Flowchart](msc_flow.png)