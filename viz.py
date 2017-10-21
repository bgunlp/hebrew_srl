import json
import os

from conllu.parser import parse as conllu_parse
from flask import Flask, render_template

app = Flask(__name__)

DATA_ROOT = os.path.join(app.root_path, 'static', 'datasubset')


def english_sents(filename):
    with open(os.path.join(DATA_ROOT, 'english_parsed', filename), encoding='utf-8') as f:
        english = conllu_parse(f.read())
    return [' '.join([row['form'] for row in sent]) for sent in english]


def create(filename):
    with open(os.path.join(DATA_ROOT, 'english_parsed', filename), encoding='utf-8') as f:
        english = conllu_parse(f.read())
    with open(os.path.join(DATA_ROOT, 'hebrew_parsed', filename), encoding='utf-8') as f:
        hebrew = conllu_parse(f.read())
    with open(os.path.join(DATA_ROOT, 'english_srl', filename), encoding='utf-8') as f:
        english_srl = [json.loads(line.strip()) for line in f]
    with open(os.path.join(DATA_ROOT, 'fastalign_outputs', filename + '.forward'), encoding='utf-8') as f:
        alignment = []
        for line in f:
            dashed_pairs = line.strip().split(' ')
            pairs = [(int(i), int(j)) for i, j in [p.split('-') for p in dashed_pairs]]
            alignment.append(pairs)
    sents = []
    for en, he, srl, alignment_ in zip(english, hebrew, english_srl, alignment):
        obj = {
            'english': {
                'frames': srl['frames'],
                'words': en
            },
            'hebrew': {
                'words': he
            },
            'alignment': alignment_
        }
        sents.append(obj)
    # return json.dumps(sents, ensure_ascii=False, indent=4)
    return sents


@app.route('/')
def index():
    files = os.listdir(os.path.join(DATA_ROOT, 'english_parsed'))
    return render_template('index.html', files=files)


@app.route('/<filename>')
def sentence_select(filename):
    sents = english_sents(filename)
    return render_template('sentenceselect.html', filename=filename, sents=sents)


@app.route('/<filename>/<sent_id>')
def tree_view(filename, sent_id):
    data = create(filename)
    return render_template('treeview.html', data=data[int(sent_id)])


if __name__ == '__main__':
    app.run()
