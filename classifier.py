from itertools import groupby

from viz import Annotation

from imdb import IMDb
from sklearn.feature_extraction import DictVectorizer
from sklearn.linear_model import PassiveAggressiveClassifier
from sklearn.pipeline import Pipeline


ia = IMDb()


# obj = {
#     'english': {
#         'frames': srl['frames'],
#         'words': en
#     },
#     'hebrew': {
#         'words': he
#     },
#     'alignment': alignment_
# }
def features(sentence):
    rating = ia.get_movie(sentence['imdbid']).get('rating', 0.0)
    en_sent_length = len(sentence['english']['words'])
    he_sent_length = len(sentence['hebrew']['words'])
    nframes = len(sentence['frames'])
    alignment = sorted(sentence['alignment'])
    alignment_groups = []
    for _, g in groupby(alignment, key=lambda t: t[0]):
        alignment_groups.append(list(g))
    one_to_ones = len([g for g in alignment_groups if len(g) == 1])
    one_to_manys = len(alignment_groups) - one_to_ones
    
    return {
        'en-sent-length': en_sent_length,
        'he-sent-length': he_sent_length,
        'en-he-ratio': en_sent_length / he_sent_length,
        'imbd-rating': rating,
        'number-of-frames': nframes,
        '1-1s': one_to_ones,
        '1-*s': one_to_manys
    }


clf = Pipeline([
    ('vectorizer', DictVectorizer(sparse=True)),
    ('classifier', PassiveAggressiveClassifier(max_iter=50))
])
