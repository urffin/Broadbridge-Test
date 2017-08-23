using System.Collections.Generic;

using System.Web.Mvc;

namespace test.Controllers
{
    [RoutePrefix("home")]
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult State()
        {
            return View();
        }
    }
}

