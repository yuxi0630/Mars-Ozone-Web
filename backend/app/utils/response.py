from flask import jsonify


def success(data=None, message="success", code=0):
    return jsonify({
        "code": code,
        "message": message,
        "data": data or {}
    })


def fail(message="fail", code=1, data=None, http_status=400):
    return jsonify({
        "code": code,
        "message": message,
        "data": data or {}
    }), http_status