import json
import os

from conllu.parser import parse as conllu_parse
from flask import Flask, render_template, request, redirect, url_for
from flask_bootstrap import Bootstrap
from flask_sqlalchemy import SQLAlchemy
from flask_wtf import FlaskForm
from wtforms import RadioField, SubmitField

app = Flask(__name__)
app.config['SECRET_KEY'] = 'balls'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///data.sqlite3'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
Bootstrap(app)
db = SQLAlchemy(app)

DATA_ROOT = os.path.join(app.root_path, 'static', 'datasubset')


class AnnotationForm(FlaskForm):
    annotation = RadioField('Annotation', choices=[
        ('err_sent', 'Error in Sentence Alignment'),
        ('err_word', 'Error in Word Alignment'),
        ('poor_trans', 'Poor Translation'),
        ('poor_syn', 'Poor Syntactic Parsing'),
        ('poor_frame', 'Poor Frame Parsing'),
        ('ok', 'OK')
    ])
    submit = SubmitField('Annotate')


class Annotation(db.Model):
    __tablename__ = 'annotations'
    file = db.Column(db.String(40), primary_key=True)
    sentence = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.String(20))

    def __repr__(self):
        return f'<Annotation for {self.file}/{self.sentence}>'


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
    return sents


@app.route('/')
def index():
    files = os.listdir(os.path.join(DATA_ROOT, 'english_parsed'))
    return render_template('index.html', files=files, page='File Selection')


@app.route('/<filename>')
def sentence_select(filename):
    sents = english_sents(filename)
    sent2annotation = {a.sentence: a for a in Annotation.query.filter_by(file=filename)}
    annotated_sents = []
    for sent_id, sent in enumerate(sents):
        annotation = sent2annotation.get(sent_id)
        if annotation:
            annotated_sents.append((sent, annotation.message))
        else:
            annotated_sents.append((sent, 'none'))
    return render_template('sentenceselect.html',
                           filename=filename,
                           sents=annotated_sents,
                           page='Sentence Selection')


@app.route('/<filename>/<sent_id>', methods=['GET', 'POST'])
def tree_view(filename, sent_id):
    annotation = Annotation.query.filter_by(file=filename, sentence=sent_id).first()
    if request.method == 'POST':
        form = AnnotationForm()
        if annotation:
            annotation.message = form.annotation.data
        else:
            db.session.add(Annotation(file=filename, sentence=sent_id, message=form.annotation.data))
        db.session.commit()
        return redirect(url_for('sentence_select', filename=filename))
    form = AnnotationForm(annotation=annotation.message) if annotation else AnnotationForm()
    data = create(filename)
    return render_template('treeview.html', data=data[int(sent_id)], page='Graphic', form=form)


if __name__ == '__main__':
    app.run()
