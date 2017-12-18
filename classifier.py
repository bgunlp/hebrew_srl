from collections import namedtuple
from itertools import groupby
from operator import itemgetter

from viz import Annotation
from viz import create as create_data

from imblearn.over_sampling import RandomOverSampler
from imblearn.pipeline import Pipeline
from sklearn.feature_extraction import DictVectorizer
from sklearn.linear_model import PassiveAggressiveClassifier
# from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report


def dfs(sentence, start):
    visited, stack = set(), [start]
    while stack:
        pass


def features(sentence):
    # rating = ia.get_movie(sentence['imdbid']).get('rating', 0.0)
    en_sent_length = len(sentence['english']['words'])
    he_sent_length = len(sentence['hebrew']['words'])
    nframes = len(sentence['english']['frames'])
    alignment = sorted(sentence['alignment'])
    alignment_groups = []
    for _, g in groupby(alignment, key=itemgetter(0)):
        alignment_groups.append(list(g))
    one_to_ones = len([g for g in alignment_groups if len(g) == 1])
    one_to_manys = len(alignment_groups) - one_to_ones

    Node = namedtuple('Node', 'token distance')
    en_head = [x for x in sentence['english']['words'] if x['head'] == 0],
    he_head = [x for x in sentence['hebrew']['words'] if x['head'] == 0],
    en_head_node = Node(en_head, 0)
    he_head_node = Node(he_head, 0)



    return {
        'en-sent-length': en_sent_length,
        'he-sent-length': he_sent_length,
        'en-he-ratio': en_sent_length / he_sent_length,
        'number-of-frames': nframes,
        '1-1s': one_to_ones / en_sent_length,
        '1-ns': one_to_manys / en_sent_length
    }


all_annotations = Annotation.query.all()
cutoff = int(.75 * len(all_annotations))
training_annotations = all_annotations[:cutoff]
test_annotations = all_annotations[cutoff:]

print(len(training_annotations))
print(len(test_annotations))


def transform_to_dataset(annotations):
    X, y = [], []
    for a in annotations:
        filename = a.file
        sent_idx = a.sentence
        label = a.message == 'ok'
        X.append(features(create_data(filename)[sent_idx]))
        y.append(label)
    return X, y


X, y = transform_to_dataset(training_annotations)

clf = Pipeline([
    ('vectorizer', DictVectorizer(sparse=True)),
    ('over-sampler', RandomOverSampler(random_state=0)),
    ('classifier', PassiveAggressiveClassifier(max_iter=50))
])

clf.fit(X, y)

print('Training Completed')

X_test, y_test = transform_to_dataset(test_annotations)

print("Accuracy:", clf.score(X_test, y_test))
print(classification_report(y_test, clf.predict(X_test)))
