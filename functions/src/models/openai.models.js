
function ChatCompletion(jsonResponse) {
    this.id = jsonResponse.id;
    this.object = jsonResponse.object;
    this.created = jsonResponse.created;
    this.model = jsonResponse.model;
    this.choices = jsonResponse.choices;
    this.usage = jsonResponse.usage;
}

