using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Http.Description;
using test.Models;

namespace test.Controllers
{
    public class TasksController : ApiController
    {
        private TaskContext db = new TaskContext();

        // GET: api/Tasks
        public IQueryable<TaskModel> GetTasks()
        {
            return db.Tasks;
        }

        // GET: api/Tasks/5
        [ResponseType(typeof(TaskModel))]
        public async Task<IHttpActionResult> GetTask(int id)
        {
            var task = await db.Tasks.FindAsync(id);
            if (task == null)
            {
                return NotFound();
            }

            return Ok(task);
        }

        // PUT: api/Tasks/5
        [ResponseType(typeof(void))]
        public async Task<IHttpActionResult> PutTask(int id, [FromBody]TaskModel task)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != task.Id)
            {
                return BadRequest();
            }

            db.Entry(task).State = EntityState.Modified;

            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TaskExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return StatusCode(HttpStatusCode.NoContent);
        }

        // POST: api/Tasks
        [ResponseType(typeof(TaskModel))]
        public async Task<IHttpActionResult> PostTask(TaskModel task)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            db.Tasks.Add(task);
            await db.SaveChangesAsync();

            return CreatedAtRoute("DefaultApi", new { id = task.Id }, task);
        }

        // DELETE: api/Tasks/5
        [ResponseType(typeof(TaskModel))]
        public async Task<IHttpActionResult> DeleteTask(int id)
        {
            var task = await db.Tasks.FindAsync(id);
            if (task == null)
            {
                return NotFound();
            }

            db.Tasks.Remove(task);
            await db.SaveChangesAsync();

            return Ok(task);
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }

        private bool TaskExists(int id)
        {
            return db.Tasks.Any(e => e.Id == id);
        }
    }
}